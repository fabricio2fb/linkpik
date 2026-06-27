import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const SearchSchema = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(["creators", "products", "all"]).optional().default("all"),
}).strict();

export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("default", ip);

    const url = new URL(request.url);
    const parsed = SearchSchema.safeParse({
      q: url.searchParams.get("q") ?? "",
      type: url.searchParams.get("type") ?? "all",
    });
    if (!parsed.success) throw new ApiError(400, "Parametros invalidos");

    const q = parsed.data.q.replace(/[%_\\]/g, "").trim();
    if (q.length < 2) throw new ApiError(400, "Busca muito curta");

    const supabase = await createSupabaseServer();
    const results: { creators?: unknown[]; products?: unknown[] } = {};

    if (parsed.data.type === "creators" || parsed.data.type === "all") {
      const { data: creators } = await supabase
        .from("creators")
        .select("username, name, bio, avatar_url")
        .eq("is_active", true)
        .eq("payment_enabled", true)
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10);
      results.creators = creators ?? [];
    }

    if (parsed.data.type === "products" || parsed.data.type === "all") {
      const { data: products } = await supabase
        .from("products")
        .select("id, title, description, price, type, cover_url, creator_id, creators!inner(username, is_active, payment_enabled)")
        .eq("is_active", true)
        .eq("creators.is_active", true)
        .eq("creators.payment_enabled", true)
        .ilike("title", `%${q}%`)
        .limit(10);
      results.products = products ?? [];
    }

    return ok(results);
  } catch (e) {
    return err(e);
  }
}
