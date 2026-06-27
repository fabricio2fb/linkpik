import { dispatchCreatorWebhook } from "@/lib/api/creator-webhooks";
import {
  getActiveEfipayAccount,
  getEfipayCharge,
  getEfipayPayment,
  isValidEfipayIp,
  mapEfipayStatus,
  validateEfipayWebhook,
} from "@/lib/api/efipay";
import { ApiError } from "@/lib/api/errors";
import { sendAccessEmail, sendPhysicalOrderConfirmedEmail } from "@/lib/api/mailer";
import { addTrackingEvent, createPublicOrderStatusToken, publicStatusUrl } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { generateAccessToken } from "@/lib/api/access-token";
import { createNotification } from "@/lib/api/notifier";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("efipay-webhook", ip).catch(() => undefined);
    if (!validateEfipayWebhook(request)) {
      return ok({ ignored: true });
    }
    if (!isValidEfipayIp(request)) {
      console.warn("[Efipay Webhook] IP de origem diferente do documentado pela Efi", {
        forwardedFor: request.headers.get("x-forwarded-for"),
        realIp: request.headers.get("x-real-ip"),
      });
    }

    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const eventId = String(payload.txid ?? payload.charge_id ?? payload.id ?? crypto.randomUUID());
    const eventType = String(payload.tipo ?? payload.event ?? "pix");
    const supabase = createSupabaseService();

    const { data: insertedEvent, error: eventError } = await supabase
      .from("payment_events")
      .insert({
        gateway: "efipay",
        event_id: eventId,
        event_type: eventType,
        payload,
        processing_status: "pending",
      })
      .select("id")
      .single();

    if (eventError) {
      if (eventError.code === "23505") return ok({ duplicated: true });
      throw new ApiError(500, "Erro ao registrar webhook");
    }

    const isPix = Boolean(payload.txid);
    const chargeId = payload.charge_id ?? payload.id;

    if (isPix && payload.txid) {
      const txid = String(payload.txid);

      const { data: order } = await supabase
        .from("orders")
        .select("id, creator_id, gateway, gateway_payment_id, status")
        .eq("gateway_payment_id", txid)
        .maybeSingle();

      if (!order) {
        await supabase.from("payment_events").update({
          processing_status: "ignored",
          processing_error: "pedido nao encontrado pelo txid",
          processed_at: new Date().toISOString(),
        }).eq("id", insertedEvent.id);
        return ok({ ignored: true });
      }

      const account = await getActiveEfipayAccount(order.creator_id);
      if (!account) throw new ApiError(404, "Conta Efipay do creator nao encontrada");

      const efipayPayment = await getEfipayPayment(txid, account);
      const nextStatus = mapEfipayStatus(efipayPayment.status);

      await processOrderStatus({
        supabase,
        eventId: insertedEvent.id,
        orderId: order.id,
        creatorId: order.creator_id,
        nextStatus,
        paymentId: txid,
        isPix: true,
        efipayStatus: efipayPayment.status,
      });

      return ok({ status: nextStatus });
    }

    if (chargeId) {
      const chargeIdNum = Number(chargeId);

      const { data: order } = await supabase
        .from("orders")
        .select("id, creator_id, gateway, gateway_payment_id, status")
        .eq("gateway_preference_id", String(chargeIdNum))
        .maybeSingle();

      if (!order) {
        await supabase.from("payment_events").update({
          processing_status: "ignored",
          processing_error: "pedido nao encontrado pelo charge_id",
          processed_at: new Date().toISOString(),
        }).eq("id", insertedEvent.id);
        return ok({ ignored: true });
      }

      const account = await getActiveEfipayAccount(order.creator_id);
      if (!account) throw new ApiError(404, "Conta Efipay do creator nao encontrada");

      const efipayCharge = await getEfipayCharge(chargeIdNum, account);
      const nextStatus = mapEfipayStatus(efipayCharge.status);

      await processOrderStatus({
        supabase,
        eventId: insertedEvent.id,
        orderId: order.id,
        creatorId: order.creator_id,
        nextStatus,
        paymentId: String(chargeIdNum),
        isPix: false,
        efipayStatus: efipayCharge.status,
      });

      return ok({ status: nextStatus });
    }

    await supabase.from("payment_events").update({
      processing_status: "ignored",
      processing_error: "sem txid ou charge_id",
      processed_at: new Date().toISOString(),
    }).eq("id", insertedEvent.id);

    return ok({ ignored: true });
  } catch (e) {
    return err(e);
  }
}

async function processOrderStatus(params: {
  supabase: ReturnType<typeof createSupabaseService>;
  eventId: string;
  orderId: string;
  creatorId: string;
  nextStatus: string;
  paymentId: string;
  isPix: boolean;
  efipayStatus: string;
}) {
  const { supabase, eventId, orderId, creatorId, nextStatus, paymentId, isPix } = params;
  const now = new Date().toISOString();

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

  if (nextStatus === "paid") {
    const updates: Record<string, unknown> = {
      status: "paid",
      gateway: "efipay",
      gateway_payment_id: paymentId,
      gateway_status: params.efipayStatus,
      paid_at: now,
    };
    if (isPix) {
      updates.pix_qr_code = null;
      updates.pix_copia_cola = null;
    }
    await supabase.from("orders").update(updates).eq("id", order.id);

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
        gateway: "efipay",
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
  } else {
    const updates: Record<string, unknown> = {
      status: nextStatus,
      gateway: "efipay",
      gateway_payment_id: paymentId,
      gateway_status: params.efipayStatus,
    };
    if (nextStatus === "paid") updates.paid_at = now;
    await supabase.from("orders").update(updates).eq("id", order.id);

    const statusWebhookEvent = webhookEventForOrderStatus(nextStatus);
    if (statusWebhookEvent && order.status !== nextStatus) {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const isPhysical = product?.product_kind === "physical" || product?.type === "fisico";
      await dispatchCreatorWebhook({
        creatorId: order.creator_id,
        event: statusWebhookEvent,
        payload: {
          order_id: order.id,
          status: nextStatus,
          gateway: "efipay",
          gateway_status: params.efipayStatus,
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
  }

  await supabase.from("payment_events").update({
    order_id: order.id,
    creator_id: creatorId,
    processing_status: "processed",
    processed_at: now,
  }).eq("id", eventId);
}

function webhookEventForOrderStatus(status: string) {
  if (status === "pending") return "order.pending" as const;
  if (status === "failed") return "order.refused" as const;
  if (status === "canceled") return "order.canceled" as const;
  if (status === "refunded") return "order.refunded" as const;
  return null;
}
