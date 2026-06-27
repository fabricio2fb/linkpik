"use client";

import { Activity, Eye, MousePointerClick, Package, Percent, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart, { type SalesChartPoint } from "@/components/dashboard/SalesChart";
import { useSession } from "@/lib/hooks/use-session";
import { formatPrice } from "@/lib/utils";

type AnalyticsData = {
  period_days: number;
  events: {
    store_view: number;
    product_view: number;
    checkout_start: number;
    checkout_complete: number;
  };
  orders_count: number;
  revenue: number;
  conversion_rate: string;
  sales_series: SalesChartPoint[];
  funnel: {
    store_view: number;
    product_view: number;
    checkout_start: number;
    checkout_complete: number;
    product_view_rate: string;
    checkout_start_rate: string;
    checkout_complete_rate: string;
  };
  previous_period: {
    orders_count: number;
    revenue: number;
    conversion_rate: string;
    events: AnalyticsData["events"];
  };
  deltas: {
    revenue: string;
    orders_count: string;
    store_view: string;
    conversion_rate: string;
  };
  top_products: Array<{
    id: string;
    title: string;
    revenue: number;
    orders_count: number;
    views: number;
    conversion_rate: string;
  }>;
};

const periodOptions = [7, 30, 90];

export default function DashboardAnalyticsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.creator) {
      setAnalytics(null);
      return;
    }
    fetch(`/api/analytics/${session.creator.username}?days=${days}`, { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setAnalytics(payload.data ?? null))
      .catch(() => setAnalytics(null));
  }, [session, sessionLoading, days]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Dados reais de trafego, conversao e receita.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {periodOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={`h-10 shrink-0 rounded-[10px] px-4 text-sm font-bold transition ${days === option ? "bg-[#FF4D6D] text-white" : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"}`}
            >
              {option} dias
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Visitas na loja" value={`${analytics?.events.store_view ?? 0}`} delta={formatDelta(analytics?.deltas.store_view, "periodo anterior")} positive={!isNegative(analytics?.deltas.store_view)} icon={Eye} color="#38BDF8" />
        <MetricCard label="Views de produto" value={`${analytics?.events.product_view ?? 0}`} delta={`${analytics?.funnel.product_view_rate ?? "0.00"}% das visitas`} icon={ShoppingBag} color="#FF4D6D" />
        <MetricCard label="Conversao" value={`${analytics?.conversion_rate ?? "0.00"}%`} delta={formatDelta(analytics?.deltas.conversion_rate, "periodo anterior")} positive={!isNegative(analytics?.deltas.conversion_rate)} icon={Percent} color="#22C55E" />
        <MetricCard label="Receita" value={formatPrice(analytics?.revenue ?? 0)} delta={formatDelta(analytics?.deltas.revenue, "periodo anterior")} positive={!isNegative(analytics?.deltas.revenue)} icon={TrendingUp} color="#F59E0B" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SalesChart data={analytics?.sales_series ?? []} />
        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Comparativo</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Periodo anterior com a mesma duracao.</p>
          <div className="mt-5 grid gap-3">
            <CompareRow label="Receita anterior" value={formatPrice(analytics?.previous_period.revenue ?? 0)} current={formatPrice(analytics?.revenue ?? 0)} />
            <CompareRow label="Pedidos anteriores" value={`${analytics?.previous_period.orders_count ?? 0}`} current={`${analytics?.orders_count ?? 0}`} />
            <CompareRow label="Conversao anterior" value={`${analytics?.previous_period.conversion_rate ?? "0.00"}%`} current={`${analytics?.conversion_rate ?? "0.00"}%`} />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Funil de conversao</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Cada etapa mostra volume e aproveitamento.</p>
            </div>
            <MousePointerClick className="text-[#FF4D6D]" size={22} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <FunnelStep label="Visitas" value={analytics?.funnel.store_view ?? 0} rate="100%" color="#38BDF8" />
            <FunnelStep label="Produto" value={analytics?.funnel.product_view ?? 0} rate={`${analytics?.funnel.product_view_rate ?? "0.00"}%`} color="#FF4D6D" />
            <FunnelStep label="Checkout" value={analytics?.funnel.checkout_start ?? 0} rate={`${analytics?.funnel.checkout_start_rate ?? "0.00"}%`} color="#F59E0B" />
            <FunnelStep label="Pago" value={analytics?.funnel.checkout_complete ?? 0} rate={`${analytics?.funnel.checkout_complete_rate ?? "0.00"}%`} color="#22C55E" />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Produtos com mais resultado</h2>
          <div className="mt-4 grid gap-3">
            {analytics?.top_products?.length ? analytics.top_products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">{product.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{product.views} views - {product.orders_count} vendas</p>
                  </div>
                  <Package className="shrink-0 text-[#FF4D6D]" size={18} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--text-primary)]">{formatPrice(product.revenue)}</span>
                  <span className="text-[var(--text-secondary)]">{product.conversion_rate}% conv.</span>
                </div>
              </div>
            )) : <p className="text-sm text-[var(--text-secondary)]">Sem dados de produtos no periodo.</p>}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Eventos do periodo</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Loja", analytics?.events.store_view ?? 0],
            ["Produto", analytics?.events.product_view ?? 0],
            ["Checkout iniciado", analytics?.events.checkout_start ?? 0],
            ["Checkout completo", analytics?.events.checkout_complete ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <Activity size={18} className="text-[#FF4D6D]" />
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function isNegative(value?: string) {
  return typeof value === "string" && Number(value) < 0;
}

function formatDelta(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const prefix = numeric > 0 ? "+" : "";
  return `${prefix}${numeric.toFixed(2)}% vs. anterior`;
}

function CompareRow({ label, value, current }: { label: string; value: string; current: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-sm">
      <div>
        <p className="font-bold text-[var(--text-primary)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Atual: {current}</p>
      </div>
      <span className="font-extrabold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function FunnelStep({ label, value, rate, color }: { label: string; value: number; rate: string; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <p className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-[var(--bg-surface)]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number.parseFloat(rate) || 0)}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 text-xs font-semibold" style={{ color }}>{rate}</p>
    </div>
  );
}
