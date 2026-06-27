import { generateAccessToken } from "@/lib/api/access-token";
import { dispatchCreatorWebhook } from "@/lib/api/creator-webhooks";
import { ApiError } from "@/lib/api/errors";
import { sendAccessEmail, sendPhysicalOrderConfirmedEmail } from "@/lib/api/mailer";
import {
  applyCreatorSubscriptionStatus,
  getCreatorPayment,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
  mapMercadoPagoStatus,
  validateMercadoPagoWebhook,
} from "@/lib/api/mercadopago";
import { createNotification } from "@/lib/api/notifier";
import { addTrackingEvent, createPublicOrderStatusToken, publicStatusUrl } from "@/lib/api/physical-orders";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";

function extractPaymentId(payload: Record<string, unknown>, requestUrl: string) {
  const url = new URL(requestUrl);
  const data = payload.data as { id?: unknown } | undefined;
  const id = data?.id ?? payload.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  return id ? String(id) : null;
}

function extractPreapprovalId(payload: Record<string, unknown>, requestUrl: string) {
  const url = new URL(requestUrl);
  const data = payload.data as { id?: unknown } | undefined;
  const id = data?.id ?? payload.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  return id ? String(id) : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    if (!validateMercadoPagoWebhook(request, rawBody)) throw new ApiError(400, "Assinatura invalida");

    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const eventId = String(payload.id ?? request.headers.get("x-request-id") ?? crypto.randomUUID());
    const eventType = String(payload.type ?? payload.action ?? "payment");
    const eventAction = String(payload.action ?? "");
    const isSubscriptionEvent = eventType.includes("preapproval") || eventAction.includes("preapproval");
    const paymentId = isSubscriptionEvent ? null : extractPaymentId(payload, request.url);
    const preapprovalId = isSubscriptionEvent ? extractPreapprovalId(payload, request.url) : null;
    const supabase = createSupabaseService();

    const { data: insertedEvent, error: eventError } = await supabase
      .from("payment_events")
      .insert({
        gateway: "mercadopago",
        event_id: eventId,
        event_type: eventType,
        event_action: eventAction || null,
        payment_id: paymentId,
        preapproval_id: preapprovalId,
        payload,
        processing_status: "pending",
      })
      .select("id")
      .single();

    if (eventError) {
      if (eventError.code === "23505") return ok({ duplicated: true });
      console.error("[MercadoPago Webhook payment_events insert error]", {
        code: eventError.code,
        message: eventError.message,
        details: eventError.details,
        hint: eventError.hint,
        error: eventError,
      });
      throw new ApiError(500, "Erro ao registrar webhook");
    }

    if (isSubscriptionEvent) {
      if (!preapprovalId) {
        await supabase.from("payment_events").update({
          processing_status: "ignored",
          processing_error: "preapproval_id ausente",
          processed_at: new Date().toISOString(),
        }).eq("id", insertedEvent.id);
        return ok({ ignored: true });
      }

      const preapproval = await getMercadoPagoPreapproval(preapprovalId);
      const creatorId = preapproval.external_reference;
      if (!creatorId) throw new ApiError(400, "Assinatura sem external_reference");

      const { data: subscription } = await supabase
        .from("creator_subscriptions")
        .select("id, plan_slug")
        .eq("mercado_pago_preapproval_id", preapproval.id)
        .maybeSingle();

      const { data: savedSubscription, error: subscriptionError } = await supabase
        .from("creator_subscriptions")
        .upsert({
          id: subscription?.id,
          creator_id: creatorId,
          gateway: "mercadopago",
          mercado_pago_preapproval_id: preapproval.id,
          payer_email: preapproval.payer_email ?? null,
          plan_slug: subscription?.plan_slug ?? "pro",
          status: preapproval.status,
          amount: preapproval.auto_recurring?.transaction_amount ?? 0,
          currency: preapproval.auto_recurring?.currency_id ?? "BRL",
          frequency: preapproval.auto_recurring?.frequency ?? 1,
          frequency_type: preapproval.auto_recurring?.frequency_type ?? "months",
          next_payment_date: preapproval.next_payment_date ?? null,
          started_at: preapproval.status === "authorized" ? (preapproval.date_created ?? new Date().toISOString()) : null,
        }, { onConflict: "mercado_pago_preapproval_id" })
        .select("id, plan_slug")
        .single();

      if (subscriptionError || !savedSubscription) throw new ApiError(500, "Erro ao salvar assinatura");

      const nextStatus = await applyCreatorSubscriptionStatus({
        creatorId,
        subscriptionId: savedSubscription.id,
        preapprovalId: preapproval.id,
        status: preapproval.status,
        planSlug: savedSubscription.plan_slug,
        nextPaymentDate: preapproval.next_payment_date ?? null,
      });

      await supabase.from("payment_events").update({
        creator_id: creatorId,
        subscription_id: savedSubscription.id,
        processing_status: "processed",
        processed_at: new Date().toISOString(),
      }).eq("id", insertedEvent.id);

      return ok({ subscription_status: nextStatus });
    }

    if (!paymentId) {
      await supabase.from("payment_events").update({
        processing_status: "ignored",
        processing_error: "payment_id ausente",
        processed_at: new Date().toISOString(),
      }).eq("id", insertedEvent.id);
      return ok({ ignored: true });
    }

    const { data: existingPaymentOrder } = await supabase
      .from("orders")
      .select("creator_id")
      .eq("gateway_payment_id", paymentId)
      .maybeSingle();

    const payment = existingPaymentOrder?.creator_id
      ? await getCreatorPayment(paymentId, existingPaymentOrder.creator_id).catch(() => getMercadoPagoPayment(paymentId))
      : await getMercadoPagoPayment(paymentId);
    const orderId = payment.external_reference;
    if (!orderId) throw new ApiError(400, "Pagamento sem external_reference");

    const { data: order } = await supabase
      .from("orders")
      .select(`
        id, status, amount, currency, buyer_email, buyer_name, product_id, creator_id,
        products(title, type, product_kind),
        order_shipments(id, status)
      `)
      .eq("id", orderId)
      .single();

    if (!order) throw new ApiError(404, "Pedido nao encontrado");

    const nextStatus = mapMercadoPagoStatus(payment.status);
    if (nextStatus === "paid") {
      const paidAmount = Number(payment.transaction_amount ?? payment.transaction_details?.total_paid_amount ?? 0);
      if (Math.abs(paidAmount - Number(order.amount ?? 0)) > 0.01) {
        throw new ApiError(400, "Valor pago divergente do pedido");
      }
      const currency = String(payment.currency_id ?? "BRL");
      if (currency !== String(order.currency ?? "BRL")) throw new ApiError(400, "Moeda divergente do pedido");
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: nextStatus,
      gateway: "mercadopago",
      gateway_payment_id: String(payment.id),
      gateway_merchant_order_id: payment.order?.id ? String(payment.order.id) : null,
      gateway_status: payment.status,
    };

    if (nextStatus === "paid" && order.status !== "paid") updates.paid_at = now;

    await supabase.from("orders").update(updates).eq("id", order.id);

    if (nextStatus === "paid" && order.status !== "paid") {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const isPhysical = product?.product_kind === "physical" || product?.type === "fisico";

      if (isPhysical) {
        const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
        if (!shipment) throw new ApiError(500, "Envio do pedido fisico nao encontrado");

        const { error: stockError } = await supabase.rpc("decrement_product_stock_safely", {
          p_product_id: order.product_id,
          p_order_id: order.id,
          p_qty: 1,
        });
        if (stockError) throw new ApiError(500, "Erro ao baixar estoque do produto");

        await supabase
          .from("order_shipments")
          .update({ status: "awaiting_preparation", last_tracking_event_at: now })
          .eq("id", shipment.id);

        await addTrackingEvent({
          orderId: order.id,
          shipmentId: shipment.id,
          creatorId: order.creator_id,
          status: "awaiting_preparation",
          title: "Pagamento aprovado",
          description: "O vendedor ja pode preparar o envio.",
          createdBy: "system",
        });

        const statusToken = await createPublicOrderStatusToken({ orderId: order.id, creatorId: order.creator_id });
        await sendPhysicalOrderConfirmedEmail({
          buyerEmail: order.buyer_email,
          buyerName: order.buyer_name,
          productTitle: product?.title ?? "Produto Pikbio",
          statusUrl: publicStatusUrl(statusToken.token),
        });

        await createNotification({
          creatorId: order.creator_id,
          type: "new_sale",
          title: "Novo pedido fisico aprovado",
          body: `Prepare o envio de ${product?.title ?? "produto"}.`,
        });
      } else {
        const access = generateAccessToken();
        const accessExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("access_tokens").insert({
          token_hash: access.hash,
          order_id: order.id,
          expires_at: accessExpiresAt,
        });

        await sendAccessEmail({
          buyerEmail: order.buyer_email,
          buyerName: order.buyer_name,
          productTitle: product?.title ?? "Produto Pikbio",
          accessToken: access.token,
          orderId: order.id,
        });

        await dispatchCreatorWebhook({
          creatorId: order.creator_id,
          event: "access.granted",
          payload: {
            order_id: order.id,
            product: product?.title ?? "Produto Pikbio",
            buyer_email: order.buyer_email,
            access_expires_at: accessExpiresAt,
          },
        });

        await createNotification({
          creatorId: order.creator_id,
          type: "new_sale",
          title: "Nova venda aprovada",
          body: `Pagamento aprovado para ${product?.title ?? "produto"}.`,
        });
      }

      await dispatchCreatorWebhook({
        creatorId: order.creator_id,
        event: "order.paid",
        payload: {
          order_id: order.id,
          status: "paid",
          gateway: "mercadopago",
          amount: Number(order.amount ?? 0),
          currency: order.currency ?? "BRL",
          product: {
            id: order.product_id,
            title: product?.title ?? "Produto Pikbio",
            type: isPhysical ? "physical" : "digital",
          },
          paid_at: now,
        },
      });
    }

    const statusWebhookEvent = webhookEventForOrderStatus(nextStatus);
    if (statusWebhookEvent && nextStatus !== "paid" && order.status !== nextStatus) {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const isPhysical = product?.product_kind === "physical" || product?.type === "fisico";
      await dispatchCreatorWebhook({
        creatorId: order.creator_id,
        event: statusWebhookEvent,
        payload: {
          order_id: order.id,
          status: nextStatus,
          gateway: "mercadopago",
          gateway_status: payment.status,
          amount: Number(order.amount ?? 0),
          currency: order.currency ?? "BRL",
          product: {
            id: order.product_id,
            title: product?.title ?? "Produto Pikbio",
            type: isPhysical ? "physical" : "digital",
          },
          updated_at: now,
        },
      });
    }

    if (nextStatus === "refunded" || nextStatus === "canceled" || nextStatus === "failed") {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
      const isPhysical = product?.product_kind === "physical" || product?.type === "fisico";
      if (isPhysical && shipment) {
        await supabase
          .from("order_shipments")
          .update({ status: nextStatus === "refunded" ? "refunded" : "cancelled" })
          .eq("order_id", order.id);
      }
    }

    await supabase.from("payment_events").update({
      order_id: order.id,
      processing_status: "processed",
      processed_at: now,
    }).eq("id", insertedEvent.id);

    return ok({ status: nextStatus });
  } catch (e) {
    console.error("[MercadoPago Webhook Error]", e);
    return err(e);
  }
}

function webhookEventForOrderStatus(status: string) {
  if (status === "pending") return "order.pending" as const;
  if (status === "failed") return "order.refused" as const;
  if (status === "canceled") return "order.canceled" as const;
  if (status === "refunded") return "order.refunded" as const;
  return null;
}
