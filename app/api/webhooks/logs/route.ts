import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const supabase = createSupabaseService();
    const { data, error, count } = await supabase
      .from("webhook_logs")
      .select("*", { count: "exact" })
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, "Erro ao carregar logs");

    return ok({
      logs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (e) {
    return err(e);
  }
}
