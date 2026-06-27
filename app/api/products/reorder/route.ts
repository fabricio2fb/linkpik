import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const ReorderProductsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0),
  })).min(1).max(100),
}).strict();

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = ReorderProductsSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id, username").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const ids = parsed.data.items.map((item) => item.id);
    const { data: products } = await supabase.from("products").select("id").in("id", ids).eq("creator_id", creator.id);
    if (!products || products.length !== ids.length) {
      throw new ApiError(403, "Um ou mais produtos nao pertencem a este creator");
    }

    for (const item of parsed.data.items) {
      await supabase.from("products").update({ position: item.position }).eq("id", item.id).eq("creator_id", creator.id);
    }

    revalidateTag(`store-${creator.username}`, "max");
    return ok({ updated: ids.length });
  } catch (e) {
    return err(e);
  }
}

