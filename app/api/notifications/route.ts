import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const url = new URL(request.url);
    const limit = Math.min(Number.parseInt(url.searchParams.get("limit") ?? "20", 10), 50);
    const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10), 0);
    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Notifications]", error);
      throw new ApiError(500, `Erro ao buscar notificacoes: ${error.message}`);
    }
    return ok({ notifications: data, total: count, limit, offset });
  } catch (e) {
    return err(e);
  }
}
