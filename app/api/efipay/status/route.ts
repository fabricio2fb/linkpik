import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getActiveEfipayAccount } from "@/lib/api/efipay";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const account = await getActiveEfipayAccount(creator.id);
    return ok({
      gateway: "efipay",
      connected: Boolean(account),
      status: account?.status ?? "pending",
      connected_at: account?.connected_at ?? null,
      has_pix_key: Boolean(account?.public_key),
    });
  } catch (e) {
    return err(e);
  }
}
