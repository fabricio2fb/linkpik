import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getPlanLimits } from "@/lib/api/plans";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { createCustomHostname, deleteCustomHostname, getCustomHostname } from "@/lib/api/cloudflare-hostnames";

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

const ConnectSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(255)
    .regex(DOMAIN_REGEX, "Dominio invalido")
    .transform((value) => value.toLowerCase()),
});

async function getCreator(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, plan").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const { creator } = await getCreator(user.id);

    const limits = getPlanLimits(creator.plan as "free" | "pro");
    if (!limits.custom_domain) {
      throw new ApiError(403, "Dominio customizado disponivel apenas no plano Pro.");
    }

    const body = await req.json().catch(() => { throw new ApiError(400, "JSON invalido"); });
    const parsed = ConnectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dominio invalido");
    }

    const domain = parsed.data.domain;
    const supabase = await createSupabaseServer();

    const { data: existing } = await supabase
      .from("creator_settings")
      .select("custom_domain, cloudflare_hostname_id, domain_verified")
      .eq("creator_id", creator.id)
      .single();

    if (existing?.cloudflare_hostname_id) {
      throw new ApiError(400, "Voce ja possui um dominio configurado. Remova-o primeiro.");
    }

    const hostname = await createCustomHostname(domain);

    const serviceClient = createSupabaseService();
    const { data: saved, error: saveError } = await serviceClient
      .from("creator_settings")
      .upsert({
        creator_id: creator.id,
        custom_domain: domain,
        cloudflare_hostname_id: hostname.id,
        domain_verified: hostname.status === "active",
      }, { onConflict: "creator_id" })
      .select("custom_domain, cloudflare_hostname_id, domain_verified")
      .single();

    if (saveError || !saved) {
      throw new ApiError(500, "Erro ao salvar dominio no banco de dados");
    }

    return ok({
      domain,
      hostnameId: hostname.id,
      status: hostname.status,
      sslStatus: hostname.ssl?.status ?? null,
      ownershipVerification: hostname.ownership_verification ?? null,
    });
  } catch (e) {
    return err(e);
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const { creator } = await getCreator(user.id);

    const supabase = createSupabaseService();
    const { data: settings } = await supabase
      .from("creator_settings")
      .select("custom_domain, cloudflare_hostname_id, domain_verified")
      .eq("creator_id", creator.id)
      .maybeSingle();

    if (!settings || !settings.custom_domain || !settings.cloudflare_hostname_id) {
      return ok({ domain: null, hostnameId: null, status: null, sslStatus: null });
    }

    let cfStatus = settings.domain_verified ? "active" : "pending";
    let cfSslStatus: string | null = null;

    try {
      const hostname = await getCustomHostname(settings.cloudflare_hostname_id);
      cfStatus = hostname.status;
      cfSslStatus = hostname.ssl?.status ?? null;

      if (hostname.status === "active" && !settings.domain_verified) {
        await supabase
          .from("creator_settings")
          .update({ domain_verified: true })
          .eq("creator_id", creator.id);
      }
    } catch {
      // Cloudflare API indisponivel, retorna o que temos no banco
    }

    return ok({
      domain: settings.custom_domain,
      hostnameId: settings.cloudflare_hostname_id,
      status: cfStatus,
      sslStatus: cfSslStatus,
    });
  } catch (e) {
    return err(e);
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser();
    const { creator } = await getCreator(user.id);

    const supabase = createSupabaseService();
    const { data: settings } = await supabase
      .from("creator_settings")
      .select("cloudflare_hostname_id")
      .eq("creator_id", creator.id)
      .maybeSingle();

    if (!settings?.cloudflare_hostname_id) {
      throw new ApiError(400, "Nenhum dominio configurado para remover");
    }

    try {
      await deleteCustomHostname(settings.cloudflare_hostname_id);
    } catch {
      // Se ja foi deletado na Cloudflare, ignora erro
    }

    await supabase
      .from("creator_settings")
      .update({
        custom_domain: null,
        cloudflare_hostname_id: null,
        domain_verified: false,
      })
      .eq("creator_id", creator.id);

    return ok({ removed: true });
  } catch (e) {
    return err(e);
  }
}
