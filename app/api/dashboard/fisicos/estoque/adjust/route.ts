import { auditLog, getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { InventoryAdjustmentSchema } from "@/lib/schemas/physical.schema";

export async function POST(request: Request) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("mutations", creator.userId);
    const body = await request.json();
    const parsed = InventoryAdjustmentSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Ajuste invalido");

    const supabase = createSupabaseService();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", parsed.data.product_id)
      .eq("creator_id", creator.creatorId)
      .maybeSingle();
    if (!product) throw new ApiError(404, "Produto nao encontrado");

    const { error } = await supabase.rpc("adjust_product_stock", {
      p_product_id: parsed.data.product_id,
      p_qty_delta: parsed.data.quantity_delta,
      p_reason: parsed.data.reason,
      p_actor: creator.userId,
    });
    if (error) throw new ApiError(400, "Nao foi possivel ajustar estoque");

    await auditLog({
      creatorId: creator.creatorId,
      actorId: creator.userId,
      action: "inventory_adjusted",
      entityType: "product",
      entityId: parsed.data.product_id,
      metadata: { quantity_delta: parsed.data.quantity_delta },
    });

    return ok({ success: true });
  } catch (e) {
    return err(e);
  }
}
