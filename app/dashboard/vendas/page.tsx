"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SalesTable from "@/components/dashboard/SalesTable";
import { mapApiOrder } from "@/lib/api-mappers";
import type { Sale } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const filters = ["Hoje", "7 dias", "30 dias", "Tudo"];
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

export default function DashboardVendasPage() {
  const [filter, setFilter] = useState("7 dias");
  const [page, setPage] = useState(1);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState({ count: 0, amount: 0 });
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const perPage = 5;

  useEffect(() => {
    const dateRange = getDateRange(filter);
    const params = new URLSearchParams({ limit: "50" });
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);

    Promise.all([
      fetch(`/api/orders?${params.toString()}`, { credentials: "include" }),
      fetch("/api/dashboard/payment-status", { credentials: "include" }),
    ])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then(([ordersPayload, paymentPayload]) => {
        setSales((ordersPayload.data?.orders ?? []).map(mapApiOrder));
        setSummary({
          count: Number(ordersPayload.data?.total ?? 0),
          amount: Number(ordersPayload.data?.total_amount ?? 0),
        });
        setPaymentStatus(paymentPayload.data?.status ?? "pending");
      })
      .catch(() => {
        setSales([]);
        setSummary({ count: 0, amount: 0 });
      });
  }, [filter]);

  const paginated = sales.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(sales.length / perPage));

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Vendas</h1>
        <div className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button key={item} onClick={() => { setFilter(item); setPage(1); }} className={`h-11 shrink-0 rounded-[10px] px-4 text-sm font-semibold transition ${filter === item ? "bg-[#FF4D6D] text-white" : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"}`}>
              {item}
            </button>
          ))}
        </div>
      </header>
      {paymentStatus !== "active" && <PaymentStatusBanner status={paymentStatus} />}
      <Card className="p-5">
        <p className="text-sm font-semibold text-[var(--text-secondary)]">Total do periodo</p>
        <p className="mt-2 font-heading text-3xl font-extrabold text-[var(--text-primary)]">{formatPrice(summary.amount)}</p>
        <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">{summary.count} venda{summary.count === 1 ? "" : "s"} no periodo filtrado</p>
      </Card>
      {paginated.length ? <SalesTable sales={paginated} /> : <Card className="p-5 text-sm text-[var(--text-secondary)]">Nenhuma venda encontrada.</Card>}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Pagina {page} de {totalPages}</p>
        <div className="flex gap-2">
          <Button className="min-h-11" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <Button className="min-h-11" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Proxima</Button>
        </div>
      </div>
    </div>
  );
}

function getDateRange(filter: string) {
  if (filter === "Tudo") return { from: "", to: "" };
  const now = new Date();
  const start = new Date(now);
  if (filter === "Hoje") {
    start.setHours(0, 0, 0, 0);
  } else if (filter === "7 dias") {
    start.setDate(now.getDate() - 7);
  } else {
    start.setDate(now.getDate() - 30);
  }
  return { from: start.toISOString(), to: now.toISOString() };
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
