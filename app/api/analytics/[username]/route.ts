import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getPlanLimits, type Plan } from "@/lib/api/plans";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();

    const { data: creator } = await supabase
      .from("creators")
      .select("id, username, plan")
      .eq("user_id", user.id)
      .eq("username", username)
      .single();

    if (!creator) throw new ApiError(403, "Sem permissao");

    const url = new URL(request.url);
    const parsedDays = Number.parseInt(url.searchParams.get("days") ?? "30", 10);
    const maxDays = getPlanLimits(creator.plan as Plan).analytics_days;
    const days = Number.isFinite(parsedDays) ? Math.min(Math.max(parsedDays, 1), maxDays) : maxDays;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const since = start.toISOString();

    const previousStart = new Date(start);
    previousStart.setDate(start.getDate() - days);
    const previousSince = previousStart.toISOString();

    const { data: events } = await supabase
      .from("analytics_events")
      .select("event, created_at, product_id")
      .eq("username", username)
      .gte("created_at", since);

    const { data: previousEvents } = await supabase
      .from("analytics_events")
      .select("event")
      .eq("username", username)
      .gte("created_at", previousSince)
      .lt("created_at", since);

    const counts = {
      store_view: 0,
      product_view: 0,
      checkout_start: 0,
      checkout_complete: 0,
    };
    const previousCounts = { ...counts };
    const productViews = new Map<string, number>();

    for (const event of events ?? []) {
      if (event.event in counts) counts[event.event as keyof typeof counts]++;
      if (event.event === "product_view" && event.product_id) {
        const productId = String(event.product_id);
        productViews.set(productId, (productViews.get(productId) ?? 0) + 1);
      }
    }

    for (const event of previousEvents ?? []) {
      if (event.event in previousCounts) previousCounts[event.event as keyof typeof previousCounts]++;
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("product_id, amount, status, created_at, paid_at, payment_method, upsell_id")
      .eq("creator_id", creator.id)
      .eq("status", "paid")
      .gte("created_at", since);

    const { data: previousOrders } = await supabase
      .from("orders")
      .select("amount")
      .eq("creator_id", creator.id)
      .eq("status", "paid")
      .gte("created_at", previousSince)
      .lt("created_at", since);

    const revenue = (orders ?? []).reduce((sum, order) => sum + Number(order.amount), 0);
    const previousRevenue = (previousOrders ?? []).reduce((sum, order) => sum + Number(order.amount), 0);
    const upsellIds = Array.from(new Set((orders ?? []).map((order) => order.upsell_id).filter(Boolean))) as string[];
    const productIds = Array.from(new Set([
      ...(orders ?? []).map((order) => String(order.product_id)).filter(Boolean),
      ...Array.from(productViews.keys()),
    ]));
    const upsellPrices = new Map<string, number>();
    const productTitles = new Map<string, string>();

    if (upsellIds.length || productIds.length) {
      const ids = Array.from(new Set([...upsellIds, ...productIds]));
      const { data: products } = await supabase
        .from("products")
        .select("id, title, price")
        .in("id", ids);

      for (const product of products ?? []) {
        productTitles.set(String(product.id), String(product.title ?? "Produto"));
        upsellPrices.set(String(product.id), Number(product.price ?? 0));
      }
    }

    const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
    const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const salesByDay = new Map<string, { date: string; day: string; revenue: number; upsell_revenue: number; orders_count: number }>();

    for (let index = 0; index < days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKeyFormatter.format(date);
      salesByDay.set(key, {
        date: key,
        day: dayFormatter.format(date).replace(".", ""),
        revenue: 0,
        upsell_revenue: 0,
        orders_count: 0,
      });
    }

    for (const order of orders ?? []) {
      const paidDate = new Date(order.paid_at ?? order.created_at);
      const key = dateKeyFormatter.format(paidDate);
      const day = salesByDay.get(key);
      if (!day) continue;
      day.revenue += Number(order.amount ?? 0);
      day.orders_count += 1;
      if (order.upsell_id) day.upsell_revenue += upsellPrices.get(String(order.upsell_id)) ?? 0;
    }

    const productStats = new Map<string, { id: string; title: string; revenue: number; orders_count: number; views: number }>();

    for (const [productId, views] of productViews) {
      productStats.set(productId, {
        id: productId,
        title: productTitles.get(productId) ?? "Produto",
        revenue: 0,
        orders_count: 0,
        views,
      });
    }

    for (const order of orders ?? []) {
      const productId = String(order.product_id);
      const current = productStats.get(productId) ?? {
        id: productId,
        title: productTitles.get(productId) ?? "Produto",
        revenue: 0,
        orders_count: 0,
        views: productViews.get(productId) ?? 0,
      };
      current.revenue += Number(order.amount ?? 0);
      current.orders_count += 1;
      productStats.set(productId, current);
    }

    const topProducts = Array.from(productStats.values())
      .map((product) => ({
        ...product,
        conversion_rate: product.views > 0 ? ((product.orders_count / product.views) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.revenue - a.revenue || b.views - a.views)
      .slice(0, 5);

    function percentDelta(current: number, previous: number) {
      if (previous === 0) return current > 0 ? "100.00" : "0.00";
      return (((current - previous) / previous) * 100).toFixed(2);
    }

    const conversionRate = counts.store_view > 0 ? ((counts.checkout_complete / counts.store_view) * 100) : 0;
    const previousConversionRate = previousCounts.store_view > 0 ? ((previousCounts.checkout_complete / previousCounts.store_view) * 100) : 0;

    return ok({
      period_days: days,
      events: counts,
      orders_count: orders?.length ?? 0,
      revenue,
      sales_series: Array.from(salesByDay.values()),
      conversion_rate: conversionRate.toFixed(2),
      funnel: {
        store_view: counts.store_view,
        product_view: counts.product_view,
        checkout_start: counts.checkout_start,
        checkout_complete: counts.checkout_complete,
        product_view_rate: counts.store_view > 0 ? ((counts.product_view / counts.store_view) * 100).toFixed(2) : "0.00",
        checkout_start_rate: counts.product_view > 0 ? ((counts.checkout_start / counts.product_view) * 100).toFixed(2) : "0.00",
        checkout_complete_rate: counts.checkout_start > 0 ? ((counts.checkout_complete / counts.checkout_start) * 100).toFixed(2) : "0.00",
      },
      previous_period: {
        events: previousCounts,
        orders_count: previousOrders?.length ?? 0,
        revenue: previousRevenue,
        conversion_rate: previousConversionRate.toFixed(2),
      },
      deltas: {
        revenue: percentDelta(revenue, previousRevenue),
        orders_count: percentDelta(orders?.length ?? 0, previousOrders?.length ?? 0),
        store_view: percentDelta(counts.store_view, previousCounts.store_view),
        conversion_rate: percentDelta(conversionRate, previousConversionRate),
      },
      top_products: topProducts,
    });
  } catch (e) {
    return err(e);
  }
}
