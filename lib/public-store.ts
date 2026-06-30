import { createSupabaseService } from "@/lib/api/supabase-service";
import { sanitizeProductPageSections } from "@/lib/api/product-page-sections";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { ProductPageSectionsSchema } from "@/lib/product-page-sections";

export const SENSITIVE_PRODUCT_DETAILS_KEYS = [
  "accessLink",
  "deliveryUrl",
  "courseUrl",
  "schedulingValue",
  "deliveryMessage",
  "thankYouMessage",
  "postPurchaseInstagram",
] as const;

type PublicProductRow = Record<string, unknown> & {
  details?: Record<string, unknown> | null;
};

const PUBLIC_PRODUCT_SELECT =
  "id, title, description, price, type, product_kind, cover_url, image_provider, image_public_id, image_url, is_active, status, is_featured, details, upsell_id, stock_quantity, stock_minimum, track_inventory, allow_backorder, weight_grams, width_cm, height_cm, length_cm, origin_zipcode, preparation_days, shipping_notes, page_sections";

const PUBLIC_PRODUCT_LEGACY_SELECT =
  "id, title, description, price, type, product_kind, cover_url, is_active, status, is_featured, details, upsell_id, stock_quantity, stock_minimum, track_inventory, allow_backorder, weight_grams, width_cm, height_cm, length_cm, origin_zipcode, preparation_days, shipping_notes";

export function sanitizePublicProductDetails<T extends PublicProductRow>(product: T): T {
  const details = product.details;
  const pageSections = ProductPageSectionsSchema.safeParse(product.page_sections);
  const productWithSections = pageSections.success
    ? { ...product, page_sections: sanitizeProductPageSections(pageSections.data) }
    : product;

  if (!details || typeof details !== "object" || Array.isArray(details)) return productWithSections;

  const safeDetails = { ...details };
  for (const key of SENSITIVE_PRODUCT_DETAILS_KEYS) {
    delete safeDetails[key];
  }

  return {
    ...productWithSections,
    details: safeDetails,
  };
}

export async function getPublicStore(username: string) {
  const supabase = createSupabaseService();

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, name, bio, avatar_url, cover_url, username, store_theme, suspended, plan")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (creatorError || !creator) {
    console.error("[PublicStore] creator not found", { username, error: creatorError });
    return null;
  }

  const productsQuery = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("creator_id", creator.id)
    .eq("is_active", true)
    .order("position");

  const linksQuery = supabase
    .from("links")
    .select("id, type, label, url, position, is_active")
    .eq("creator_id", creator.id)
    .eq("is_active", true)
    .order("position");
  const settingsQuery = supabase
    .from("creator_settings")
    .select("meta_pixel_id, google_analytics_measurement_id, tiktok_pixel_id")
    .eq("creator_id", creator.id)
    .maybeSingle();

  const [productsResult, linksResult, settingsResult] = await Promise.all([productsQuery, linksQuery, settingsQuery]);
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

  const { data: links, error: linksError } = linksResult;

  if (productsError || linksError) {
    console.error("[PublicStore] related data error", { username, productsError, linksError });
    return null;
  }

  return {
    creator,
    settings: settingsResult.data ?? null,
    products: (products ?? [])
      .filter((product) => FEATURE_PHYSICAL_PRODUCT || (product.type !== "fisico" && product.product_kind !== "physical"))
      .map(sanitizePublicProductDetails),
    links: links ?? [],
  };
}
