import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";

export const revalidate = 60;

const PUBLIC_PRODUCT_SELECT =
  "id, title, description, price, type, product_kind, cover_url, image_provider, image_public_id, image_url, stock_quantity, weight_grams, width_cm, height_cm, length_cm, preparation_days";

const PUBLIC_PRODUCT_LEGACY_SELECT =
  "id, title, description, price, type, product_kind, cover_url, stock_quantity, weight_grams, width_cm, height_cm, length_cm, preparation_days";

export async function GET(_request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;
    const supabase = await createSupabaseServer();
    const { data: creator, error } = await supabase
      .from("creators")
      .select("id, name, bio, avatar_url, cover_url, username, store_theme")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (error || !creator) throw new ApiError(404, "Loja nao encontrada");

    const productsResult = await supabase
      .from("products")
      .select(PUBLIC_PRODUCT_SELECT)
      .eq("creator_id", creator.id)
      .eq("is_active", true)
      .order("position");
    let products: Record<string, unknown>[] | null = productsResult.data;
    let productsError = productsResult.error;

    if (productsError?.code === "42703") {
      const legacyProducts = await supabase
        .from("products")
        .select(PUBLIC_PRODUCT_LEGACY_SELECT)
        .eq("creator_id", creator.id)
        .eq("is_active", true)
        .order("position");
      products = legacyProducts.data;
      productsError = legacyProducts.error;
    }

    if (productsError) throw new ApiError(500, "Erro ao buscar produtos");
    const publicProducts = (products ?? []).filter((product) => FEATURE_PHYSICAL_PRODUCT || (product.type !== "fisico" && product.product_kind !== "physical"));
    return ok({ creator, products: publicProducts });
  } catch (e) {
    return err(e);
  }
}
