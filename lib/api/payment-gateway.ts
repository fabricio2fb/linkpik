import { ApiError } from "./errors";
import { createSupabaseService } from "./supabase-service";

export type PaymentGateway = "mercadopago" | "efipay";

export async function getConnectedPaymentGateways(creatorId: string) {
  const supabase = createSupabaseService();
  const { data, error } = await supabase
    .from("creator_marketplace_accounts")
    .select("gateway")
    .eq("creator_id", creatorId)
    .eq("status", "active");

  if (error) throw new ApiError(500, "Erro ao consultar gateways conectados");

  return new Set((data ?? []).map((account) => account.gateway as PaymentGateway));
}

export async function setDefaultPaymentGateway(creatorId: string, gateway: PaymentGateway | null) {
  const supabase = createSupabaseService();
  const { data, error } = await supabase
    .from("creator_settings")
    .update({ default_payment_gateway: gateway })
    .eq("creator_id", creatorId)
    .select("default_payment_gateway")
    .single();

  if (error || !data) throw new ApiError(500, "Erro ao salvar gateway ativo");
  return data.default_payment_gateway as PaymentGateway | null;
}

export async function chooseDefaultPaymentGateway(creatorId: string, requestedGateway: PaymentGateway) {
  const connected = await getConnectedPaymentGateways(creatorId);
  if (!connected.has(requestedGateway)) {
    throw new ApiError(400, "Gateway escolhido nao esta conectado");
  }

  return setDefaultPaymentGateway(creatorId, requestedGateway);
}

export async function ensureDefaultPaymentGateway(creatorId: string, gateway: PaymentGateway) {
  const supabase = createSupabaseService();
  const { data: settings, error } = await supabase
    .from("creator_settings")
    .select("default_payment_gateway")
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) throw new ApiError(500, "Erro ao consultar gateway ativo");
  if (settings?.default_payment_gateway) return settings.default_payment_gateway as PaymentGateway;

  return setDefaultPaymentGateway(creatorId, gateway);
}

export async function refreshDefaultPaymentGatewayAfterDisconnect(creatorId: string, disconnectedGateway: PaymentGateway) {
  const supabase = createSupabaseService();
  const [{ data: settings, error: settingsError }, connected] = await Promise.all([
    supabase
      .from("creator_settings")
      .select("default_payment_gateway")
      .eq("creator_id", creatorId)
      .maybeSingle(),
    getConnectedPaymentGateways(creatorId),
  ]);

  if (settingsError) throw new ApiError(500, "Erro ao consultar gateway ativo");

  if (settings?.default_payment_gateway !== disconnectedGateway) {
    return settings?.default_payment_gateway as PaymentGateway | null;
  }

  const nextGateway = connected.has("mercadopago")
    ? "mercadopago"
    : connected.has("efipay")
      ? "efipay"
      : null;

  return setDefaultPaymentGateway(creatorId, nextGateway);
}
