import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { applyCreatorSubscriptionStatus, cancelMercadoPagoPreapproval } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function POST() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const { data: subscription } = await supabase
      .from("creator_subscriptions")
      .select("id, mercado_pago_preapproval_id")
      .eq("creator_id", creator.id)
      .eq("gateway", "mercadopago")
      .in("status", ["pending", "authorized", "active", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.mercado_pago_preapproval_id) throw new ApiError(404, "Assinatura Mercado Pago nao encontrada");

    await cancelMercadoPagoPreapproval(subscription.mercado_pago_preapproval_id);
    await applyCreatorSubscriptionStatus({
      creatorId: creator.id,
      subscriptionId: subscription.id,
      preapprovalId: subscription.mercado_pago_preapproval_id,
      status: "cancelled",
    });

    return ok({ status: "cancelled" });
  } catch (e) {
    return err(e);
  }
}

