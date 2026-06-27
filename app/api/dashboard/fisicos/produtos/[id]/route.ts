import { getCreatorContext, auditLog } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { UpdatePhysicalProductSchema, UuidSchema } from "@/lib/schemas/physical.schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const creator = await getCreatorContext();
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await applyRateLimit("mutations", creator.userId);
    }

    const { id } = await context.params;
    const parsedId = UuidSchema.safeParse(id);
    if (!parsedId.success) throw new ApiError(400, "Produto invalido");
    const productId = parsedId.data;
    const body = await request.json();
    const parsed = UpdatePhysicalProductSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      throw new ApiError(400, field ? `Dados invalidos: ${field}` : "Dados invalidos");
    }

    const supabase = createSupabaseService();
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("creator_id", creator.creatorId)
      .maybeSingle();
    if (!existing) throw new ApiError(404, "Produto nao encontrado");

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status) updateData.is_active = parsed.data.status === "active";
    if (parsed.data.title) updateData.title = parsed.data.title.trim();
    updateData.product_kind = "physical";
    updateData.type = "fisico";

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .eq("creator_id", creator.creatorId)
      .select()
      .single();

    if (error || !data) {
      console.error("[PhysicalProductsUpdate]", { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
      if (error?.code === "23505") {
        throw new ApiError(400, "Dados invalidos: SKU ja existe para este creator");
      }
      throw new ApiError(500, "Erro ao atualizar produto fisico");
    }
    await auditLog({ creatorId: creator.creatorId, actorId: creator.userId, action: "physical_product_updated", entityType: "product", entityId: productId });
    return ok(data);
  } catch (e) {
    return err(e);
  }
}
