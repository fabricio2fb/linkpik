import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { applyCreatorSubscriptionStatus, getMercadoPagoPreapproval } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

async function getBilling() {
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

export async function GET() {
  return getBilling();
}

export async function POST() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const { data: subscription } = await supabase
      .from("creator_subscriptions")
      .select("id, mercado_pago_preapproval_id, plan_slug, status")
      .eq("creator_id", creator.id)
      .eq("gateway", "mercadopago")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      subscription?.mercado_pago_preapproval_id &&
      subscription.status !== "cancelled_pending_expiration" &&
      subscription.status !== "cancelled"
    ) {
      const preapproval = await getMercadoPagoPreapproval(subscription.mercado_pago_preapproval_id);
      await applyCreatorSubscriptionStatus({
        creatorId: creator.id,
        subscriptionId: subscription.id,
        preapprovalId: subscription.mercado_pago_preapproval_id,
        status: preapproval.status,
        planSlug: subscription.plan_slug ?? "pro",
        nextPaymentDate: preapproval.next_payment_date ?? null,
      });
    }

    return getBilling();
  } catch (e) {
    return err(e);
  }
}
