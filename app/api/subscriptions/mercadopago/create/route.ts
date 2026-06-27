import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { createCreatorSubscription } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function POST() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase
      .from("creators")
      .select("id, plan")
      .eq("user_id", user.id)
      .single();

    if (!creator) throw new ApiError(404, "Creator nao encontrado");
    if (creator.plan === "pro") throw new ApiError(400, "Voce ja tem o plano Pro.");
    if (!user.email) throw new ApiError(400, "Email do usuario nao encontrado");

    const result = await createCreatorSubscription({
      creatorId: creator.id,
      payerEmail: user.email,
      planSlug: "pro",
    });

    return ok({
      checkout_url: result.checkoutUrl,
      preapproval_id: result.preapprovalId,
      subscription: result.subscription,
    });
  } catch (e) {
    return err(e);
  }
}

