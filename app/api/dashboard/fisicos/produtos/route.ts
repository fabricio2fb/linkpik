import { getCreatorContext, auditLog } from "@/lib/api/physical-orders";
import { getPhysicalProducts } from "@/lib/api/physical-dashboard";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { ApiError } from "@/lib/api/errors";
import { CreatePhysicalProductSchema } from "@/lib/schemas/physical.schema";
import { PaginationQuerySchema } from "@/lib/api/dashboard-utils";

export async function GET(request: Request) {
  try {
    const creator = await getCreatorContext();
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await applyRateLimit("dashboard", creator.userId);
    }
    const parsed = PaginationQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) throw new ApiError(400, "Filtros invalidos");
    return ok(await getPhysicalProducts(parsed.data));
  } catch (e) {
    return err(e);
  }
}

export async function POST(request: Request) {
  try {
    const creator = await getCreatorContext();
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await applyRateLimit("mutations", creator.userId);
    }
    const body = await request.json();
    const parsed = CreatePhysicalProductSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      throw new ApiError(400, field ? `Dados invalidos: ${field}` : "Dados invalidos");
    }

    const supabase = createSupabaseService();
    const { data, error } = await supabase
      .from("products")
      .insert({
        creator_id: creator.creatorId,
        title: parsed.data.title.trim(),
        description: parsed.data.description ?? "",
        price: parsed.data.price,
        type: "fisico",
        product_kind: "physical",
        status: parsed.data.status,
        is_active: parsed.data.status === "active",
        sku: parsed.data.sku ?? null,
        stock_quantity: parsed.data.stock_quantity,
        stock_minimum: parsed.data.stock_minimum,
        track_inventory: parsed.data.track_inventory,
        allow_backorder: parsed.data.allow_backorder,
        weight_grams: parsed.data.weight_grams,
        width_cm: parsed.data.width_cm,
        height_cm: parsed.data.height_cm,
        length_cm: parsed.data.length_cm,
        origin_zipcode: parsed.data.origin_zipcode,
        preparation_days: parsed.data.preparation_days,
        shipping_notes: parsed.data.shipping_notes ?? null,
        details: {},
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[PhysicalProductsCreate]", { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
      if (error?.code === "23514") {
        throw new ApiError(400, "Dados invalidos: constraint do banco para produto fisico");
      }
      if (error?.code === "23505") {
        throw new ApiError(400, "Dados invalidos: SKU ja existe para este creator");
      }
      if (error?.code === "42501") {
        throw new ApiError(500, "Permissao insuficiente para criar produto fisico. Aplique as migrations de grants.");
      }
      throw new ApiError(500, "Erro ao criar produto fisico");
    }
    await auditLog({ creatorId: creator.creatorId, actorId: creator.userId, action: "physical_product_created", entityType: "product", entityId: data.id });
    return ok(data, 201);
  } catch (e) {
    return err(e);
  }
}
