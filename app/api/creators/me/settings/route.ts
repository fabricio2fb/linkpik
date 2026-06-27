import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getPlanLimits, type Plan } from "@/lib/api/plans";
import { err, ok } from "@/lib/api/response";
import { sanitizeText } from "@/lib/api/sanitize";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { UpdateSettingsSchema } from "@/lib/schemas/creator.schema";

function hideGatewaySecrets(data: Record<string, unknown>) {
  const masked = { ...data };
  for (const field of ["meta_pixel_token", "tiktok_pixel_token", "webhook_secret"]) {
    if (typeof masked[field] === "string" && masked[field]) masked[field] = "••••••••";
  }
  return masked;
}

async function getCreator(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, plan").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const { supabase, creator } = await getCreator(user.id);
    const { data, error } = await supabase.from("creator_settings").select("*").eq("creator_id", creator.id).single();
    if (error || !data) throw new ApiError(404, "Settings nao encontradas");
    return ok(hideGatewaySecrets(data));
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const { supabase, creator } = await getCreator(user.id);
    if (parsed.data.custom_domain !== undefined) {
      const limits = getPlanLimits(creator.plan as Plan);
      if (!limits.custom_domain) {
        throw new ApiError(403, "Dominio customizado disponivel apenas no plano Pro.");
      }
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    for (const secretField of ["meta_pixel_token", "tiktok_pixel_token", "webhook_secret"]) {
      if (updates[secretField] === "••••••••") delete updates[secretField];
    }
    if (typeof updates.custom_domain === "string") {
      updates.custom_domain = sanitizeText(updates.custom_domain).toLowerCase();
      updates.domain_verified = false;
    }
    for (const field of [
      "bank_name",
      "bank_account_type",
      "bank_agency",
      "bank_account",
      "bank_document",
      "bank_holder",
      "notify_whatsapp_number",
      "meta_pixel_id",
      "meta_pixel_token",
      "google_analytics_measurement_id",
      "tiktok_pixel_id",
      "tiktok_pixel_token",
      "webhook_secret",
    ]) {
      if (typeof updates[field] === "string") updates[field] = sanitizeText(updates[field] as string);
    }
    // default_gateway nao precisa de sanitizacao (é enum validado pelo schema)
    if (updates.default_gateway !== undefined) {
      // validacao extra: garantir que o gateway escolhido esta conectado
      const { data: account } = await supabase
        .from("creator_marketplace_accounts")
        .select("id")
        .eq("creator_id", creator.id)
        .eq("gateway", updates.default_gateway)
        .eq("status", "active")
        .maybeSingle();
      if (!account) {
        throw new ApiError(400, `Gateway ${updates.default_gateway} nao esta conectado`);
      }
    }
    if (typeof updates.webhook_url === "string") updates.webhook_url = sanitizeText(updates.webhook_url);
    if (Array.isArray(updates.webhook_events)) {
      updates.webhook_events = updates.webhook_events.map((event) => sanitizeText(String(event))).filter(Boolean);
    }

    const { data, error } = await supabase
      .from("creator_settings")
      .update(updates)
      .eq("creator_id", creator.id)
      .select()
      .single();

    if (error || !data) throw new ApiError(500, "Erro ao atualizar settings");
    return ok(hideGatewaySecrets(data));
  } catch (e) {
    return err(e);
  }
}
