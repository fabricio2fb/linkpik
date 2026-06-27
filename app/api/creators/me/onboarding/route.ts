import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const UpdateOnboardingSchema = z.object({
  profile_done: z.boolean().optional(),
  pix_done: z.boolean().optional(),
  product_done: z.boolean().optional(),
}).strict();

async function getCreator(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const { supabase, creator } = await getCreator(user.id);
    const { data } = await supabase.from("onboarding_steps").select("*").eq("creator_id", creator.id).single();
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = UpdateOnboardingSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const { supabase, creator } = await getCreator(user.id);
    const updates: Record<string, unknown> = { ...parsed.data };
    const { data: current } = await supabase
      .from("onboarding_steps")
      .select("profile_done, pix_done, product_done")
      .eq("creator_id", creator.id)
      .single();
    const next = { ...(current ?? {}), ...parsed.data };
    if (next.profile_done && next.pix_done && next.product_done) updates.completed_at = new Date().toISOString();

    const { data } = await supabase.from("onboarding_steps").update(updates).eq("creator_id", creator.id).select().single();

    if (parsed.data.pix_done) {
      const { data: account } = await supabase
        .from("creator_marketplace_accounts")
        .select("id")
        .eq("creator_id", creator.id)
        .eq("gateway", "mercadopago")
        .eq("status", "active")
        .maybeSingle();

      if (!account) {
        throw new ApiError(400, "Conecte sua conta Mercado Pago antes de ativar pagamentos.");
      }

      await supabase.from("creators").update({ payment_enabled: true }).eq("id", creator.id);
    }

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
