import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { getDigitalProducts } from "@/lib/api/digital-products";
import { formatCurrency, isDigitalProduct, maskEmail, orderStatusLabel, startDateForPeriod, type PaginationQuery } from "@/lib/api/dashboard-utils";

export async function getDigitalSales(query: PaginationQuery) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;
  const startDate = startDateForPeriod(query.period ?? "30");

  let ordersQuery = supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, amount, status, created_at, products(id, title, type, product_kind), access_tokens(id)", { count: "exact" })
    .eq("creator_id", creator.creatorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.status) ordersQuery = ordersQuery.eq("status", query.status);
  if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate);

  const { data, count, error } = await ordersQuery;
  if (error) throw error;

  const orders = (data ?? []).filter((order) => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    return isDigitalProduct(product);
  });

  return {
    sales: orders.map((order) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const accessRows = Array.isArray(order.access_tokens) ? order.access_tokens : [];
      return {
        id: order.id,
        order_id: order.id,
        raw_amount: Number(order.amount ?? 0),
        raw_status: order.status ?? "",
        raw_created_at: order.created_at,
        order: String(order.id).slice(0, 8),
        customer: order.buyer_name || maskEmail(order.buyer_email),
        buyer_email: maskEmail(order.buyer_email),
        product: product?.title ?? "Produto",
        value: formatCurrency(Number(order.amount ?? 0)),
        payment_status: orderStatusLabel(order.status),
        access_status: accessRows.length ? "Acesso liberado" : order.status === "paid" ? "Acesso pendente" : "Pendente",
        channel: "Mercado Pago",
        date: new Date(order.created_at).toLocaleDateString("pt-BR"),
        can_resend_access: order.status === "paid",
        action: order.status === "paid" ? "Reenviar acesso" : "Ver pedido",
      };
    }),
    total: count ?? orders.length,
    limit,
    offset,
  };
}

export async function getDigitalOverview() {
  const [sales, products] = await Promise.all([
    getDigitalSales({ limit: 50, offset: 0, period: "30" }),
    getDigitalProducts({ limit: 50, offset: 0 }),
  ]);
  const paidSales = sales.sales.filter((sale) => sale.payment_status === "Pago");
  const released = sales.sales.filter((sale) => sale.access_status === "Acesso liberado").length;
  const pending = sales.sales.filter((sale) => sale.access_status === "Acesso pendente").length;
  return {
    metrics: {
      products: products.products.length,
      active_products: products.products.filter((product) => product.status === "Ativo").length,
      sales: paidSales.length,
      revenue: paidSales.reduce((sum, sale) => sum + Number(String(sale.value).replace(/[^\d,]/g, "").replace(",", ".")), 0),
      access_released: released,
      access_pending: pending,
      delivery_rate: paidSales.length ? Math.round((released / paidSales.length) * 100) : 0,
    },
    latest_sales: sales.sales.slice(0, 5),
  };
}
