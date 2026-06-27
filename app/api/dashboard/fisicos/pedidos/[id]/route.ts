import { getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { UuidSchema } from "@/lib/schemas/physical.schema";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("dashboard", creator.userId);
    const { id } = await context.params;
    const parsedId = UuidSchema.safeParse(id);
    if (!parsedId.success) throw new ApiError(400, "Pedido invalido");

    const supabase = createSupabaseService();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, buyer_name, buyer_email, amount, platform_fee, creator_amount, status, created_at, paid_at,
        products(id, title, type, product_kind, cover_url),
        order_shipping_addresses(*),
        order_shipments(*),
        order_tracking_events(*)
      `)
      .eq("id", parsedId.data)
      .eq("creator_id", creator.creatorId)
      .single();

    if (error || !data) throw new ApiError(404, "Pedido nao encontrado");
    const product = Array.isArray(data.products) ? data.products[0] : data.products;
    if (product?.product_kind !== "physical" && product?.type !== "fisico") throw new ApiError(404, "Pedido nao encontrado");

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
