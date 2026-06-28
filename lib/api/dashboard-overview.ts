import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { formatCurrency, isDigitalProduct, isPhysicalProduct, startDateForPeriod, type PaginationQuery } from "@/lib/api/dashboard-utils";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";

export async function getDashboardPaymentStatus(creatorId?: string) {
  const creator = creatorId ? null : await getCreatorContext();
  const supabase = createSupabaseService();
  const { data: accounts } = await supabase
    .from("creator_marketplace_accounts")
    .select("gateway, status, connected_at")
    .eq("creator_id", creatorId ?? creator!.creatorId)
    .eq("status", "active");

  const activeAccount = accounts?.[0];

  return {
    status: activeAccount ? "active" : "pending",
    gateway: activeAccount?.gateway ?? null,
    connected_at: activeAccount?.connected_at ?? null,
  };
}

export async function getDashboardOverview(query: Pick<PaginationQuery, "period"> = { period: "30" }) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const startDate = startDateForPeriod(query.period ?? "30");

  let ordersQuery = supabase
    .from("orders")
    .select("id, amount, platform_fee, creator_amount, status, created_at, products(product_kind, type)")
    .eq("creator_id", creator.creatorId);
  if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate);

  const [{ data: orders }, { data: products }, payment] = await Promise.all([
    ordersQuery,
    supabase.from("products").select("id, is_active, product_kind, type").eq("creator_id", creator.creatorId),
    getDashboardPaymentStatus(creator.creatorId),
  ]);

  const orderRows = orders ?? [];
  const paidOrders = orderRows.filter((order) => order.status === "paid");
  const activeProducts = (products ?? []).filter((product) => product.is_active);

  const digitalSales = paidOrders.filter((order) => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    return isDigitalProduct(product);
  }).length;

  const physicalSales = paidOrders.filter((order) => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    return isPhysicalProduct(product);
  }).length;

  const gross = paidOrders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
  const fees = paidOrders.reduce((sum, order) => sum + Number(order.platform_fee ?? 0), 0);
  const net = paidOrders.reduce((sum, order) => sum + Number(order.creator_amount ?? 0), 0);
  const pendingOrders = orderRows.filter((order) => order.status === "pending").length;
  const totalSales = paidOrders.length;
  const averageTicket = totalSales > 0 ? gross / totalSales : 0;

  return {
    payment_status: payment.status,
    metrics: [
      { label: "Receita bruta", value: formatCurrency(gross), delta: "ultimos 30 dias", color: "#22C55E" },
      { label: "Ticket medio", value: formatCurrency(averageTicket), delta: "valor medio por venda", color: "#38BDF8" },
      { label: "Liquido", value: formatCurrency(net), delta: "valor do creator", color: "#FF4D6D" },
      { label: "Pedidos pendentes", value: String(pendingOrders), delta: "aguardando pagamento", color: "#F59E0B", positive: pendingOrders === 0 },
    ],
    summary: {
      total_sales: paidOrders.length,
      gross,
      platform_fee: fees,
      creator_amount: net,
      active_products: activeProducts.length,
      pending_orders: pendingOrders,
      digital_sales: digitalSales,
      physical_sales: FEATURE_PHYSICAL_PRODUCT ? physicalSales : 0,
    },
    quick_metrics: [
      { label: "Produtos ativos", value: String(activeProducts.length), delta: "catalogo publicado", color: "#38BDF8" },
      { label: "Vendas digitais", value: String(digitalSales), delta: "infoprodutos pagos", color: "#FF4D6D" },
      ...(FEATURE_PHYSICAL_PRODUCT
        ? [{ label: "Vendas fisicas", value: String(physicalSales), delta: "pedidos fisicos pagos", color: "#22C55E" }]
        : []),
    ],
  };
}
