import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { maskEmail, type PaginationQuery } from "@/lib/api/dashboard-utils";

export async function getDigitalAccess(query: Pick<PaginationQuery, "limit" | "offset" | "search">) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const { data, count, error } = await supabase
    .from("access_tokens")
    .select(`
      id, token_hash, used_at, expires_at, created_at,
      orders!inner(
        id, buyer_name, buyer_email, creator_id,
        products(title, type, product_kind)
      )
    `, { count: "exact" })
    .eq("orders.creator_id", creator.creatorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const accesses = (data ?? []).map((access) => {
    const order = Array.isArray(access.orders) ? access.orders[0] : access.orders;
    const product = Array.isArray(order?.products) ? order.products[0] : order?.products;
    const expired = new Date(access.expires_at).getTime() < Date.now();
    return {
      id: access.id,
      order_id: order?.id ?? "",
      customer: order?.buyer_name ?? maskEmail(order?.buyer_email),
      product: product?.title ?? "Produto",
      email: maskEmail(order?.buyer_email),
      token: `${String(access.token_hash).slice(0, 8)}...`,
      status: expired ? "Expirado" : "Liberado",
      released_at: new Date(access.created_at).toLocaleDateString("pt-BR"),
      last_access: access.used_at ? new Date(access.used_at).toLocaleDateString("pt-BR") : "Nunca acessou",
      action: "Reenviar acesso",
    };
  });

  return { accesses, total: count ?? accesses.length, limit, offset };
}
