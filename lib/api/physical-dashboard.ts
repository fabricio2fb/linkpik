import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { formatCurrency, isPhysicalProduct, maskEmail, orderStatusLabel, shipmentStatusLabel, startDateForPeriod, type PaginationQuery } from "@/lib/api/dashboard-utils";

export async function getPhysicalOverview() {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, amount, status, created_at, products(id, title, product_kind, type), order_shipments(status)")
      .eq("creator_id", creator.creatorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, title, stock_quantity, stock_minimum, is_active, product_kind, type")
      .eq("creator_id", creator.creatorId)
      .or("product_kind.eq.physical,type.eq.fisico"),
  ]);

  const physicalOrders = (orders ?? []).filter((order) => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    return isPhysicalProduct(product);
  });
  const shipments = physicalOrders.map((order) => Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments);
  const paid = physicalOrders.filter((order) => order.status === "paid");
  const productRows = products ?? [];

  return {
    revenue: paid.reduce((sum, order) => sum + Number(order.amount ?? 0), 0),
    orders: physicalOrders.length,
    awaiting_shipping: shipments.filter((shipment) => ["awaiting_preparation", "awaiting_label", "label_generated", "awaiting_postage"].includes(shipment?.status ?? "")).length,
    in_transit: shipments.filter((shipment) => shipment?.status === "in_transit").length,
    delivered_month: shipments.filter((shipment) => shipment?.status === "delivered").length,
    low_stock: productRows.filter((product) => Number(product.stock_quantity ?? 0) <= Number(product.stock_minimum ?? 0)).length,
    stock_total: productRows.reduce((sum, product) => sum + Number(product.stock_quantity ?? 0), 0),
    recent_orders: physicalOrders.slice(0, 5).map((order) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
      return {
        id: order.id,
        order: String(order.id).slice(0, 8),
        product: product?.title ?? "Produto",
        total: formatCurrency(Number(order.amount ?? 0)),
        status: shipmentStatusLabel(shipment?.status) || orderStatusLabel(order.status),
        action: "Ver pedido",
      };
    }),
  };
}

export async function getPhysicalProducts(query: Pick<PaginationQuery, "limit" | "offset" | "status" | "search">) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  let productsQuery = supabase
    .from("products")
    .select("id, title, price, stock_quantity, stock_minimum, weight_grams, width_cm, height_cm, length_cm, status, is_active, created_at", { count: "exact" })
    .eq("creator_id", creator.creatorId)
    .or("product_kind.eq.physical,type.eq.fisico")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (query.status) productsQuery = productsQuery.eq("status", query.status);
  if (query.search) productsQuery = productsQuery.ilike("title", `%${query.search}%`);

  const { data: products, count, error } = await productsQuery;
  if (error) throw error;
  const ids = (products ?? []).map((product) => product.id);
  const { data: orders } = ids.length
    ? await supabase.from("orders").select("product_id, amount, status").in("product_id", ids)
    : { data: [] };

  const rows = (products ?? []).map((product) => {
    const paidOrders = (orders ?? []).filter((order) => order.product_id === product.id && order.status === "paid");
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
    return {
      id: product.id,
      product: product.title,
      price: formatCurrency(Number(product.price ?? 0)),
      stock: Number(product.stock_quantity ?? 0),
      weight: product.weight_grams ? `${product.weight_grams}g` : "-",
      size: product.width_cm && product.height_cm && product.length_cm ? `${product.width_cm} x ${product.height_cm} x ${product.length_cm} cm` : "-",
      sales: paidOrders.length,
      revenue: formatCurrency(revenue),
      status: product.is_active ? "Ativo" : "Pausado",
      action: "Editar",
    };
  });

  return { products: rows, total: count ?? rows.length, limit, offset };
}

export async function getPhysicalOrders(query: PaginationQuery) {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;
  const startDate = startDateForPeriod(query.period ?? "30");

  let ordersQuery = supabase
    .from("orders")
    .select(`
      id, buyer_name, buyer_email, amount, status, created_at,
      products(id, title, product_kind, type),
      order_shipments(id, status, shipping_method, shipping_carrier, tracking_code, shipping_deadline_days)
    `, { count: "exact" })
    .eq("creator_id", creator.creatorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (query.status) ordersQuery = ordersQuery.eq("status", query.status);
  if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate);

  const { data, count, error } = await ordersQuery;
  if (error) throw error;
  const orders = (data ?? []).filter((order) => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    return isPhysicalProduct(product);
  });

  return {
    orders: orders.map((order) => {
      const product = Array.isArray(order.products) ? order.products[0] : order.products;
      const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
      return {
        id: order.id,
        order: String(order.id).slice(0, 8),
        customer: order.buyer_name || maskEmail(order.buyer_email),
        product: product?.title ?? "Produto",
        total: formatCurrency(Number(order.amount ?? 0)),
        shipping: shipment?.shipping_method ?? "-",
        status: shipmentStatusLabel(shipment?.status),
        tracking: shipment?.tracking_code ?? "Nao informado",
        action: "Ver detalhes",
      };
    }),
    total: count ?? orders.length,
    limit,
    offset,
  };
}

export async function getPhysicalInventory() {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, sku, stock_quantity, stock_minimum, track_inventory, is_active")
    .eq("creator_id", creator.creatorId)
    .or("product_kind.eq.physical,type.eq.fisico")
    .order("title");
  if (error) throw error;

  const rows = (products ?? []).map((product) => {
    const stock = Number(product.stock_quantity ?? 0);
    const minimum = Number(product.stock_minimum ?? 0);
    const status = stock <= 0 ? "Esgotado" : stock <= minimum ? "Baixo estoque" : "Ok";
    return {
      id: product.id,
      product: product.title,
      sku: product.sku ?? "-",
      current: stock,
      minimum,
      sold7: 0,
      sold30: 0,
      coverage: stock > 0 ? "Sem histórico suficiente" : "Sem estoque",
      status,
      lastSale: "-",
      action: "Ajustar",
    };
  });

  return {
    products: rows,
    summary: {
      total_units: rows.reduce((sum, product) => sum + Number(product.current), 0),
      active_products: rows.length,
      low_stock: rows.filter((product) => product.status === "Baixo estoque").length,
      sold_out: rows.filter((product) => product.status === "Esgotado").length,
    },
    alerts: rows.filter((product) => product.status !== "Ok").map((product) => ({
      title: `${product.product} precisa de atencao`,
      text: product.status === "Esgotado" ? "Produto esgotado. Vendas devem ficar pausadas." : "Estoque abaixo do minimo configurado.",
      tone: product.status === "Esgotado" ? "danger" : "warning",
      action: "Ajustar",
    })),
  };
}
