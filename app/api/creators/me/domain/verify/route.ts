import dns from "dns/promises";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("default", ip);

    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const { data: settings } = await supabase
      .from("creator_settings")
      .select("custom_domain, domain_verified")
      .eq("creator_id", creator.id)
      .single();

    if (!settings?.custom_domain) throw new ApiError(400, "Nenhum dominio configurado");
    if (settings.domain_verified) return ok({ verified: true, domain: settings.custom_domain });

    const expectedTarget = "pik.bio";
    let verified = false;
    try {
      const records = await dns.resolveCname(settings.custom_domain);
      verified = records.some((record) => record.toLowerCase().includes(expectedTarget));
    } catch {
      verified = false;
    }

    if (verified) {
      await createSupabaseService()
        .from("creator_settings")
        .update({ domain_verified: true })
        .eq("creator_id", creator.id);
    }

    return ok({
      verified,
      domain: settings.custom_domain,
      message: verified
        ? "Dominio verificado com sucesso!"
        : `Configure um CNAME de ${settings.custom_domain} apontando para ${expectedTarget}`,
    });
  } catch (e) {
    return err(e);
  }
}

