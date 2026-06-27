import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { createMercadoPagoOAuthUrl, signOAuthState } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function POST() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    return ok({ url: createMercadoPagoOAuthUrl(signOAuthState(user.id)) });
  } catch (e) {
    return err(e);
  }
}

