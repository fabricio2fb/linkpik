import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { isDigitalProduct, type PaginationQuery } from "@/lib/api/dashboard-utils";
import { formatPrice } from "@/lib/utils";

type ProductRow = {
  id: string;
  title: string | null;
  price: number | string | null;
  status?: string | null;
  is_active?: boolean | null;
  type?: string | null;
  product_kind?: string | null;
  details?: unknown;
  created_at?: string | null;
};

type ProductQueryResult = {
  data: ProductRow[] | null;
  count: number | null;
  error: { code?: string; message?: string } | null;
};

export async function getDigitalProducts(query: Pick<PaginationQuery, "limit" | "offset" | "status" | "search">) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  let productsQuery = supabase
    .from("products")
    .select("id, title, price, status, is_active, type, product_kind, details, created_at", { count: "exact" })
    .eq("creator_id", creator.creatorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.status) productsQuery = productsQuery.eq("status", query.status);
  if (query.search) productsQuery = productsQuery.ilike("title", `%${query.search}%`);

  let productsResult = await productsQuery as ProductQueryResult;
  if (productsResult.error?.code === "42703") {
    let legacyQuery = supabase
      .from("products")
      .select("id, title, price, is_active, type, created_at", { count: "exact" })
      .eq("creator_id", creator.creatorId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.search) legacyQuery = legacyQuery.ilike("title", `%${query.search}%`);
    productsResult = await legacyQuery as ProductQueryResult;
  }
  if (productsResult.error) {
    console.error("[DigitalProducts]", { code: productsResult.error.code, message: productsResult.error.message });
    return { products: [], total: 0, limit, offset };
  }

  const products = (productsResult.data ?? []) as ProductRow[];
  const count = productsResult.count;

  const productIds = products.map((product) => product.id);
  const { data: orders, error: ordersError } = productIds.length
    ? await supabase.from("orders").select("product_id, amount, status, created_at").in("product_id", productIds)
    : { data: [] };
  if (ordersError) console.error("[DigitalProductsOrders]", { code: ordersError.code, message: ordersError.message });

  const rows = products.filter((product) => isDigitalProduct(product)).map((product) => {
    const productOrders = (orders ?? []).filter((order) => order.product_id === product.id && order.status === "paid");
    const revenue = productOrders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
    const lastSale = productOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const details = product.details && typeof product.details === "object" && !Array.isArray(product.details) ? product.details as Record<string, unknown> : {};
    return {
      id: product.id,
      product: product.title,
      delivery: String(details.deliveryPlatform ?? details.accessMethod ?? "Entrega digital"),
      price: formatPrice(Number(product.price ?? 0)),
      sales: productOrders.length,
      revenue: formatPrice(revenue),
      status: product.is_active ? "Ativo" : product.status === "draft" ? "Rascunho" : "Pausado",
      last_sale: lastSale ? new Date(lastSale.created_at).toLocaleDateString("pt-BR") : "-",
      action: "Editar",
    };
  });

  return { products: rows, total: count ?? rows.length, limit, offset };
}
