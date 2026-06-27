import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getActiveMarketplaceAccount } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const account = await getActiveMarketplaceAccount(creator.id);
    return ok({
      gateway: "mercadopago",
      connected: Boolean(account),
      status: account?.status ?? "pending",
      external_user_id: account?.external_user_id ?? null,
      connected_at: account?.connected_at ?? null,
      expires_at: account?.expires_at ?? null,
    });
  } catch (e) {
    return err(e);
  }
}

