import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase
      .from("creators")
      .select("id, plan, plan_expires_at")
      .eq("user_id", user.id)
      .single();

    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const { data: subscription } = await supabase
      .from("creator_subscriptions")
      .select("*")
      .eq("creator_id", creator.id)
      .eq("gateway", "mercadopago")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return ok({
      plan: creator.plan,
      plan_expires_at: creator.plan_expires_at,
      is_pro: creator.plan === "pro",
      subscription: subscription ?? null,
    });
  } catch (e) {
    return err(e);
  }
}

