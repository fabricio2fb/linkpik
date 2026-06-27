"use client";

import Link from "next/link";
import { AlertTriangle, Copy, ExternalLink, Eye, MousePointerClick, Percent, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart, { type SalesChartPoint } from "@/components/dashboard/SalesChart";
import SalesTable from "@/components/dashboard/SalesTable";
import { mapApiOrder } from "@/lib/api-mappers";
import { useSession } from "@/lib/hooks/use-session";
import type { Sale } from "@/lib/types";
import { formatPrice, todayLong } from "@/lib/utils";

type AnalyticsPayload = {
  events?: { store_view?: number; checkout_complete?: number };
  orders_count?: number;
  revenue?: number;
  conversion_rate?: string;
  sales_series?: SalesChartPoint[];
  deltas?: { revenue?: string; orders_count?: string; store_view?: string; conversion_rate?: string };
  funnel?: {
    store_view: number;
    product_view: number;
    checkout_start: number;
    checkout_complete: number;
    product_view_rate: string;
    checkout_start_rate: string;
    checkout_complete_rate: string;
  };
  top_products?: Array<{
    id: string;
    title: string;
    revenue: number;
    orders_count: number;
    views: number;
    conversion_rate: string;
  }>;
};

type Onboarding = {
  completed_at: string | null;
  pix_done: boolean;
  product_done: boolean;
  profile_done: boolean;
};

type PaymentStatus = "pending" | "verification_pending" | "rejected" | "active";

const paymentBannerByStatus: Record<Exclude<PaymentStatus, "active">, { text: string }> = {
  pending: {
    text: "Conecte um gateway de pagamento (Mercado Pago ou Efi Bank) para começar a receber vendas.",
  },
  verification_pending: {
    text: "Finalize a conexão do seu gateway de pagamento para ativar recebimentos.",
  },
  rejected: {
    text: "Seus dados foram recusados. Revise e reenvie para ativar recebimentos.",
  },
};

export default function DashboardPage() {
  const { session, loading: sessionLoading } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [overview, setOverview] = useState<{ summary?: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.creator) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/${session.creator.username}?days=30`, { credentials: "include" }),
      fetch("/api/orders?limit=5", { credentials: "include" }),
      fetch("/api/creators/me/onboarding", { credentials: "include" }),
      fetch("/api/dashboard/payment-status", { credentials: "include" }),
      fetch("/api/dashboard/overview?period=30", { credentials: "include" }),
    ])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then(([analyticsPayload, ordersPayload, onboardingPayload, paymentPayload, overviewPayload]) => {
        setAnalytics(analyticsPayload.data ?? null);
        setSales((ordersPayload.data?.orders ?? []).map(mapApiOrder));
        setOnboarding(onboardingPayload.data ?? null);
        setPaymentStatus(paymentPayload.data?.status ?? "pending");
        setOverview(overviewPayload.data ?? null);
      })
      .catch(() => {
        setAnalytics(null);
        setSales([]);
      })
      .finally(() => setLoading(false));
  }, [session, sessionLoading]);

  async function copyLink() {
    const username = session?.creator?.username ?? "";
    await navigator.clipboard?.writeText(`${origin}/${username}`);
    setToast("Link copiado");
    window.setTimeout(() => setToast(null), 2000);
  }

  if (!sessionLoading && !loading && !session?.creator) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Sessao nao encontrada.</div>;
  }

  const username = session?.creator?.username ?? "";
  const revenue = overview?.summary?.gross ?? analytics?.revenue ?? 0;
  const ticketMedio = (overview?.summary?.total_sales && revenue) ? revenue / overview.summary.total_sales : 0;
  const visitors = analytics?.events?.store_view ?? 0;
  const conversion = analytics?.conversion_rate ?? "0.00";
  const productViews = analytics?.funnel?.product_view ?? 0;
  const checkoutStarts = analytics?.funnel?.checkout_start ?? 0;
  const topProducts = analytics?.top_products ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-[22px] font-extrabold text-[var(--text-primary)] md:text-3xl">Ola @{username}</h1>
          <p className="mt-1 text-sm capitalize text-[var(--text-secondary)]">{todayLong()}</p>
        </div>
      </header>

      {paymentStatus !== "active" && (
        <PaymentStatusBanner status={paymentStatus} />
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Receita bruta" value={formatPrice(revenue)} delta="ultimos 30 dias" icon={TrendingUp} color="#22C55E" />
        <MetricCard label="Pedidos pagos" value={`${overview?.summary?.total_sales ?? analytics?.orders_count ?? 0}`} delta="vendas aprovadas" icon={ShoppingBag} color="#FF4D6D" />
        <MetricCard label="Ticket medio" value={formatPrice(ticketMedio)} delta="valor medio por venda" icon={TrendingUp} color="#38BDF8" />
        <MetricCard label="Liquido" value={formatPrice(overview?.summary?.creator_amount ?? 0)} delta="valor do creator" icon={Eye} color="#F59E0B" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SalesChart data={(analytics?.sales_series ?? []).slice(-7)} />
        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Link da bio</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Compartilhe sua loja nos perfis sociais.</p>
          <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="break-all text-sm font-bold text-[var(--text-primary)]">{origin || "https://pik.bio"}/{username || "loja"}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button onClick={copyLink}><Copy size={16} />Copiar</Button>
            <Link href={`/${username || "loja"}`} target="_blank"><Button variant="secondary" className="w-full"><ExternalLink size={16} />Abrir</Button></Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Funil da loja</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Do acesso na bio ate o checkout concluido.</p>
            </div>
            <MousePointerClick className="text-[#FF4D6D]" size={22} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <FunnelMiniStep label="Visitas" value={visitors} rate="100%" color="#38BDF8" />
            <FunnelMiniStep label="Produtos" value={productViews} rate={`${analytics?.funnel?.product_view_rate ?? "0.00"}%`} color="#FF4D6D" />
            <FunnelMiniStep label="Checkout" value={checkoutStarts} rate={`${analytics?.funnel?.checkout_start_rate ?? "0.00"}%`} color="#F59E0B" />
            <FunnelMiniStep label="Pagos" value={analytics?.funnel?.checkout_complete ?? 0} rate={`${analytics?.funnel?.checkout_complete_rate ?? "0.00"}%`} color="#22C55E" />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Top produtos</h2>
          <div className="mt-4 grid gap-3">
            {topProducts.length ? topProducts.slice(0, 3).map((product) => (
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
            )) : <p className="text-sm text-[var(--text-secondary)]">Sem dados de produtos ainda.</p>}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Ultimas vendas</h2>
        {sales.length ? <SalesTable sales={sales} compact /> : <Card className="p-5 text-sm text-[var(--text-secondary)]">Nenhuma venda ainda.</Card>}
      </section>
      <Toast message={toast} />
    </div>
  );
}

function PaymentStatusBanner({ status }: { status: Exclude<PaymentStatus, "active"> }) {
  const banner = paymentBannerByStatus[status];

  return (
    <Card className="border-[#F59E0B]/25 bg-[#F59E0B]/10 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{banner.text}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Conecte o Mercado Pago para liberar o checkout dos seus produtos.</p>
          </div>
        </div>
        <Link href="/dashboard/configuracoes?tab=pagamentos" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <ExternalLink size={16} />
            Configurar agora
          </Button>
        </Link>
      </div>
    </Card>
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

function FunnelMiniStep({ label, value, rate, color }: { label: string; value: number; rate: string; color: string }) {
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
