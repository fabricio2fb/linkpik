import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { disconnectEfipayAccount, getActiveEfipayAccount } from "@/lib/api/efipay";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("efipay-disconnect", ip);

    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const account = await getActiveEfipayAccount(creator.id);
    if (!account) throw new ApiError(404, "Conta Efipay nao encontrada");

    await disconnectEfipayAccount(creator.id);
    return ok({ connected: false, status: "disconnected" });
  } catch (e) {
    return err(e);
  }
}
