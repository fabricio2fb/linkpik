import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("orders_read", ip);
    const user = await getAuthUser();
    const { id } = await context.params;
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

    if (error || !data) throw new ApiError(404, "Pedido nao encontrado");
    if (data.buyer_email !== user.email) throw new ApiError(403, "Acesso negado");

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
