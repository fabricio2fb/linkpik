import { getAuthUser } from "@/lib/api/auth";
import { dispatchCreatorWebhook } from "@/lib/api/creator-webhooks";
import { createMarketplacePreference, createMercadoPagoPixPayment, getActiveMarketplaceAccount } from "@/lib/api/mercadopago";
import { createEfipayBankSlip, createEfipayPixCharge, getActiveEfipayAccount } from "@/lib/api/efipay";
import { calculateMarketplaceFees, type Plan } from "@/lib/api/plans";
import { createPublicOrderStatusToken, publicStatusUrl } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { hashCpf } from "@/lib/api/sanitize";
import { calculateManualShipping } from "@/lib/api/shipping";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { CreateOrderSchema } from "@/lib/schemas/order.schema";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (from && Number.isNaN(Date.parse(from))) throw new ApiError(400, "Data inicial invalida");
    if (to && Number.isNaN(Date.parse(to))) throw new ApiError(400, "Data final invalida");

    let query = supabase
      .from("orders")
      .select("*, products(type, product_kind)", { count: "exact" })
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    if (from) query = query.gte("created_at", new Date(from).toISOString());
    if (to) query = query.lte("created_at", new Date(to).toISOString());

    const [{ data, error }, summary] = await Promise.all([
      query.range(offset, offset + limit - 1),
      getOrdersSummary(supabase, creator.id, from, to),
    ]);

    if (error) {
      console.error("[Orders]", error);
      throw new ApiError(500, `Erro ao listar pedidos: ${error.message}`);
    }
    const orders = (data ?? []).filter((order) => {
      if (FEATURE_PHYSICAL_PRODUCT) return true;
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return product?.type !== "fisico" && product?.product_kind !== "physical";
    });
    return ok({ orders, total: summary.count, total_amount: summary.amount, limit, offset });
  } catch (e) {
    return err(e);
  }
}

async function getOrdersSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  creatorId: string,
  from: string | null,
  to: string | null,
) {
  let offset = 0;
  let count = 0;
  let amount = 0;

  while (true) {
    let query = supabase
      .from("orders")
      .select("amount, products(type, product_kind)")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);

    if (from) query = query.gte("created_at", new Date(from).toISOString());
    if (to) query = query.lte("created_at", new Date(to).toISOString());

    const { data, error } = await query;
    if (error) throw new ApiError(500, `Erro ao calcular total de pedidos: ${error.message}`);

    const rows = data ?? [];
    const filteredRows = rows.filter((order) => {
      if (FEATURE_PHYSICAL_PRODUCT) return true;
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      return product?.type !== "fisico" && product?.product_kind !== "physical";
    });

    count += filteredRows.length;
    amount += filteredRows.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);

    if (rows.length < 1000) break;
    offset += 1000;
  }

  return { count, amount };
}

type CheckoutResult = {
  gateway: "mercadopago" | "efipay";
  checkoutUrl: string;
  gatewayPreferenceId: string;
  gatewayPaymentId?: string;
  expiresAt?: string | null;
  pixCopiaECola?: string;
  qrCodeImage?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
};

async function resolveGateway(creatorId: string, paymentMethodPreference?: string): Promise<"mercadopago" | "efipay"> {
  const supabaseService = createSupabaseService();
  const [mpAccount, efipayAccount, settings] = await Promise.all([
    getActiveMarketplaceAccount(creatorId),
    getActiveEfipayAccount(creatorId),
    supabaseService.from("creator_settings").select("default_payment_gateway, default_gateway").eq("creator_id", creatorId).maybeSingle(),
  ]);

  const mpActive = Boolean(mpAccount);
  const efipayActive = Boolean(efipayAccount);
  const efipayHasPixKey = Boolean(efipayAccount?.public_key);
  const configuredGateway = settings?.data?.default_payment_gateway ?? settings?.data?.default_gateway ?? "mercadopago";

  if (configuredGateway === "mercadopago" && mpActive) return "mercadopago";
  if (configuredGateway === "efipay" && efipayActive) return "efipay";

  if (!mpActive && !efipayActive) {
    throw new ApiError(400, "Nenhum gateway de pagamento conectado. Configure o Mercado Pago ou Efí Bank nas configurações.");
  }

  // Se comprador escolheu PIX mas Efí não tem chave PIX, redireciona para MP se disponível ou boleto Efí
  if (paymentMethodPreference === "pix" && efipayActive && !efipayHasPixKey && mpActive) return "mercadopago";
  if (paymentMethodPreference === "pix" && efipayActive && !efipayHasPixKey) return "efipay"; // fallback boleto no createGatewayCheckout

  if (paymentMethodPreference === "pix" && efipayActive) return "efipay";
  if (paymentMethodPreference === "boleto" && efipayActive) return "efipay";

  if (mpActive && !efipayActive) return "mercadopago";
  if (efipayActive && !mpActive) return "efipay";

  const defaultGateway = settings?.data?.default_payment_gateway ?? settings?.data?.default_gateway ?? "mercadopago";
  if (defaultGateway === "efipay" && efipayActive) return "efipay";
  return "mercadopago";
}

async function createGatewayCheckout(params: {
  gateway: "mercadopago" | "efipay";
  orderId: string;
  productTitle: string;
  amount: number;
  platformFee: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  creatorId: string;
  paymentMethodPreference?: string;
}): Promise<CheckoutResult> {
  if (params.gateway === "mercadopago") {
    const account = await getActiveMarketplaceAccount(params.creatorId);
    if (!account) throw new ApiError(400, "Conta Mercado Pago nao encontrada");

    if (params.paymentMethodPreference === "pix") {
      const payment = await createMercadoPagoPixPayment({
        account,
        orderId: params.orderId,
        productTitle: params.productTitle,
        amount: params.amount,
        platformFee: params.platformFee,
        buyerName: params.buyerName,
        buyerEmail: params.buyerEmail,
        buyerCpf: params.buyerCpf,
      });

      return {
        gateway: "mercadopago",
        checkoutUrl: "",
        gatewayPreferenceId: payment.paymentId,
        gatewayPaymentId: payment.paymentId,
        pixCopiaECola: payment.pixCopiaECola,
        qrCodeImage: payment.qrCodeBase64 ? `data:image/png;base64,${payment.qrCodeBase64}` : "",
        expiresAt: payment.expiresAt,
      };
    }

    const preference = await createMarketplacePreference({
      account,
      orderId: params.orderId,
      productTitle: params.productTitle,
      amount: params.amount,
      platformFee: params.platformFee,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerCpf: params.buyerCpf,
    });

    return {
      gateway: "mercadopago",
      checkoutUrl: preference.checkoutUrl ?? "",
      gatewayPreferenceId: preference.preferenceId,
      expiresAt: preference.expiresAt,
    };
  }

  const account = await getActiveEfipayAccount(params.creatorId);
  if (!account) throw new ApiError(400, "Conta Efí Bank nao encontrada");

  const hasPixKey = Boolean(account.public_key);
  const preferencia = params.paymentMethodPreference ?? "pix";

  // Se comprador escolheu PIX mas criador não tem chave PIX configurada:
  // fallback automático para boleto. Se nem boleto estiver disponível, retorna erro.
  if (preferencia === "pix" && !hasPixKey) {
    const slip = await createEfipayBankSlip({
      account,
      orderId: params.orderId,
      productTitle: params.productTitle,
      amount: params.amount,
      platformFee: params.platformFee,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerCpf: params.buyerCpf,
    });
    return {
      gateway: "efipay",
      checkoutUrl: slip.checkoutUrl,
      gatewayPreferenceId: String(slip.chargeId),
      boletoUrl: slip.checkoutUrl,
      boletoBarcode: slip.barcodeUrl,
    };
  }

  if (preferencia === "boleto") {
    const slip = await createEfipayBankSlip({
      account,
      orderId: params.orderId,
      productTitle: params.productTitle,
      amount: params.amount,
      platformFee: params.platformFee,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerCpf: params.buyerCpf,
    });
    return {
      gateway: "efipay",
      checkoutUrl: slip.checkoutUrl,
      gatewayPreferenceId: String(slip.chargeId),
      boletoUrl: slip.checkoutUrl,
      boletoBarcode: slip.barcodeUrl,
    };
  }

  if (!hasPixKey) {
    throw new ApiError(400, "PAYMENT_METHOD_UNAVAILABLE: Este criador nao configurou uma chave PIX. Tente outro metodo de pagamento.");
  }

  const pix = await createEfipayPixCharge({
    account,
    orderId: params.orderId,
    productTitle: params.productTitle,
    amount: params.amount,
    platformFee: params.platformFee,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerCpf: params.buyerCpf,
  });
  return {
    gateway: "efipay",
    checkoutUrl: "",
    gatewayPreferenceId: pix.txid,
    pixCopiaECola: pix.pixCopiaECola,
    qrCodeImage: pix.qrCodeImage,
  };
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("orders", ip);

    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const supabase = await createSupabaseServer();
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status, gateway, checkout_url")
      .eq("idempotency_key", parsed.data.idempotency_key)
      .maybeSingle();

    if (existing) return ok(existing);

    const { data: product } = await supabase
      .from("products")
      .select(`
        id, price, creator_id, is_active, title, type, product_kind,
        stock_quantity, track_inventory, allow_backorder,
        weight_grams, width_cm, height_cm, length_cm, origin_zipcode
      `)
      .eq("id", parsed.data.product_id)
      .single();

    if (!product || !product.is_active) throw new ApiError(404, "Produto nao encontrado");
    const isPhysical = product.product_kind === "physical" || product.type === "fisico";
    if (!FEATURE_PHYSICAL_PRODUCT && isPhysical) throw new ApiError(404, "Produto nao encontrado");

    const { data: creator } = await supabase
      .from("creators")
      .select("id, is_active, payment_enabled, plan, suspended")
      .eq("id", product.creator_id)
      .single();

    if (creator?.suspended) {
      throw new ApiError(400, "Loja suspensa temporariamente");
    }

    if (!creator?.is_active || !creator?.payment_enabled) {
      throw new ApiError(400, "Loja sem pagamentos habilitados");
    }

    let totalAmount = Number(product.price);
    let selectedShipping: Awaited<ReturnType<typeof calculateManualShipping>>[number] | null = null;
    let upsellProduct: { id: string; price: number; is_active: boolean; creator_id: string } | null = null;

    if (isPhysical) {
      if (!parsed.data.shipping_address || !parsed.data.shipping_option_id) {
        throw new ApiError(400, "Endereco e frete sao obrigatorios para produto fisico");
      }

      if (product.track_inventory && !product.allow_backorder && Number(product.stock_quantity ?? 0) < 1) {
        throw new ApiError(400, "Produto sem estoque disponivel");
      }

      const quotes = await calculateManualShipping({
        originZipcode: product.origin_zipcode,
        destinationZipcode: parsed.data.shipping_address.zipcode,
        weightGrams: Number(product.weight_grams),
        widthCm: Number(product.width_cm),
        heightCm: Number(product.height_cm),
        lengthCm: Number(product.length_cm),
      });
      selectedShipping = quotes.find((quote) => quote.id === parsed.data.shipping_option_id) ?? null;
      if (!selectedShipping) throw new ApiError(400, "Opcao de frete invalida");
      totalAmount += selectedShipping.priceCents / 100;
    }

    if (parsed.data.upsell_id && !isPhysical) {
      const { data: up } = await supabase
        .from("products")
        .select("id, price, is_active, creator_id")
        .eq("id", parsed.data.upsell_id)
        .eq("creator_id", product.creator_id)
        .single();

      if (up?.is_active) {
        upsellProduct = up;
        totalAmount += up.price;
      }
    }

    const supabaseService = createSupabaseService();

    const gateway = await resolveGateway(creator.id, parsed.data.payment_method_preference);
    const { platformFee, creatorAmount } = calculateMarketplaceFees({
      amount: totalAmount,
      plan: creator.plan as Plan,
    });

    const { data: order, error } = await supabaseService
      .from("orders")
      .insert({
        product_id: product.id,
        upsell_id: upsellProduct?.id ?? null,
        creator_id: creator.id,
        buyer_email: parsed.data.buyer_email,
        buyer_name: parsed.data.buyer_name,
        buyer_cpf_hash: hashCpf(parsed.data.buyer_cpf),
        amount: totalAmount,
        platform_fee: platformFee,
        creator_amount: creatorAmount,
        payment_method: gateway,
        status: "pending",
        gateway,
        currency: "BRL",
        idempotency_key: parsed.data.idempotency_key,
        payment_method_preference: parsed.data.payment_method_preference,
      })
      .select()
      .single();

    if (error || !order) throw new ApiError(500, "Erro ao criar pedido");

    let checkoutResult: CheckoutResult;
    try {
      checkoutResult = await createGatewayCheckout({
        gateway,
        orderId: order.id,
        productTitle: product.title,
        amount: totalAmount,
        platformFee,
        buyerName: parsed.data.buyer_name,
        buyerEmail: parsed.data.buyer_email,
        buyerCpf: parsed.data.buyer_cpf,
        creatorId: creator.id,
        paymentMethodPreference: parsed.data.payment_method_preference,
      });
    } catch (e) {
      await supabaseService
        .from("orders")
        .update({ status: "failed", gateway_status: "preference_failed" })
        .eq("id", order.id);
      throw e;
    }

    if (!checkoutResult.checkoutUrl && !checkoutResult.pixCopiaECola) {
      throw new ApiError(500, "Gateway nao retornou URL de checkout nem dados PIX");
    }

    const updateFields: Record<string, unknown> = {
      gateway_preference_id: checkoutResult.gatewayPreferenceId,
      checkout_url: checkoutResult.checkoutUrl,
      gateway_status: "pending",
      payment_expires_at: checkoutResult.expiresAt ?? null,
    };

    if (checkoutResult.gatewayPaymentId) updateFields.gateway_payment_id = checkoutResult.gatewayPaymentId;
    if (checkoutResult.pixCopiaECola) updateFields.pix_copia_cola = checkoutResult.pixCopiaECola;
    if (checkoutResult.qrCodeImage) updateFields.pix_qr_code = checkoutResult.qrCodeImage;
    if (checkoutResult.boletoUrl) updateFields.boleto_url = checkoutResult.boletoUrl;
    if (checkoutResult.boletoBarcode) updateFields.boleto_barcode = checkoutResult.boletoBarcode;

    await supabaseService
      .from("orders")
      .update(updateFields)
      .eq("id", order.id);

    let orderStatusToken: string | null = null;
    if (isPhysical && parsed.data.shipping_address && selectedShipping) {
      const address = parsed.data.shipping_address;
      const { error: addressError } = await supabaseService.from("order_shipping_addresses").insert({
        order_id: order.id,
        creator_id: creator.id,
        buyer_name: parsed.data.buyer_name,
        buyer_email: parsed.data.buyer_email,
        buyer_phone: address.buyer_phone ?? null,
        zipcode: address.zipcode,
        street: address.street,
        number: address.number,
        complement: address.complement ?? null,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: "BR",
      });
      if (addressError) throw new ApiError(500, "Erro ao salvar endereco de entrega");

      const { data: shipment, error: shipmentError } = await supabaseService
        .from("order_shipments")
        .insert({
          order_id: order.id,
          creator_id: creator.id,
          product_id: product.id,
          shipping_method: selectedShipping.method,
          shipping_carrier: selectedShipping.carrier,
          shipping_price: selectedShipping.priceCents,
          shipping_deadline_days: selectedShipping.deadlineDays,
          status: "awaiting_payment",
          label_status: "not_generated",
        })
        .select("id")
        .single();
      if (shipmentError || !shipment) throw new ApiError(500, "Erro ao criar envio do pedido");

      await supabaseService.from("order_tracking_events").insert({
        order_id: order.id,
        shipment_id: shipment.id,
        creator_id: creator.id,
        status: "awaiting_payment",
        title: "Pedido criado",
        description: "Aguardando confirmacao do pagamento.",
        created_by: "system",
      });

      const publicToken = await createPublicOrderStatusToken({
        orderId: order.id,
        creatorId: creator.id,
        expiresAt: null,
      });
      orderStatusToken = publicToken.token;
    }

    await dispatchCreatorWebhook({
      creatorId: creator.id,
      event: "order.pending",
      payload: {
        order_id: order.id,
        status: "pending",
        gateway,
        amount: totalAmount,
        currency: "BRL",
        product: product.title,
        checkout_url: checkoutResult.checkoutUrl,
      },
    });

    return ok({
      order_id: order.id,
      gateway,
      checkout_url: checkoutResult.checkoutUrl,
      order_status_url: orderStatusToken ? publicStatusUrl(orderStatusToken) : null,
      pix_copia_cola: checkoutResult.pixCopiaECola ?? null,
      qr_code_image: checkoutResult.qrCodeImage ?? null,
      boleto_url: checkoutResult.boletoUrl ?? null,
      boleto_barcode: checkoutResult.boletoBarcode ?? null,
    });
  } catch (e) {
    return err(e);
  }
}
