import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { calculateManualShipping } from "@/lib/api/shipping";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { ApiError } from "@/lib/api/errors";
import { ShippingQuoteSchema } from "@/lib/schemas/physical.schema";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await applyRateLimit("shipping", ip);

    const body = await request.json();
    const parsed = ShippingQuoteSchema.safeParse(body);
    if (!parsed.success) {
      const invalidField = parsed.error.issues[0]?.path[0];
      if (invalidField === "product_id") throw new ApiError(400, "Produto invalido para calcular frete");
      if (invalidField === "destination_zipcode") throw new ApiError(400, "CEP invalido para calcular frete");
      throw new ApiError(400, "Dados de frete invalidos");
    }

    const supabase = await createSupabaseServer();
    const { data: product } = await supabase
      .from("products")
      .select("id, is_active, type, product_kind, weight_grams, width_cm, height_cm, length_cm, origin_zipcode")
      .eq("id", parsed.data.product_id)
      .single();

    if (!product || !product.is_active) throw new ApiError(404, "Produto nao encontrado");
    const isPhysical = product.product_kind === "physical" || product.type === "fisico";
    if (!isPhysical) throw new ApiError(400, "Produto nao possui entrega fisica");

    const quotes = await calculateManualShipping({
      originZipcode: product.origin_zipcode,
      destinationZipcode: parsed.data.destination_zipcode,
      weightGrams: Number(product.weight_grams),
      widthCm: Number(product.width_cm),
      heightCm: Number(product.height_cm),
      lengthCm: Number(product.length_cm),
    });

    return ok({ quotes });
  } catch (e) {
    return err(e);
  }
}
