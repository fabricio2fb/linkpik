"use client";

import { CheckCircle, Download, KeyRound, Package, ShoppingBag, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";

const columns = [
  { key: "order", label: "Pedido" },
  { key: "customer", label: "Cliente" },
  { key: "product", label: "Produto" },
  { key: "value", label: "Valor", tone: "accent" as const },
  { key: "payment_status", label: "Pagamento" },
  { key: "access_status", label: "Acesso" },
  { key: "date", label: "Data" },
];

export default function InfoprodutosDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/infoprodutos/overview", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setData(payload.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics ?? {};
  const rows = data?.latest_sales ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Painel digital</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Resumo das vendas digitais, acessos liberados e produtos ativos.</p>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard label="Receita digital" value={`R$ ${Number(metrics.revenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} delta="ultimos 30 dias" icon={Wallet} color="#22C55E" />
        <MetricCard label="Vendas digitais" value={String(metrics.sales ?? 0)} delta="pedidos pagos" icon={ShoppingBag} color="#FF4D6D" />
        <MetricCard label="Produtos ativos" value={String(metrics.active_products ?? 0)} delta="infoprodutos publicados" icon={Package} color="#38BDF8" />
        <MetricCard label="Acessos liberados" value={String(metrics.access_released ?? 0)} delta="entregas digitais" icon={KeyRound} color="#22C55E" />
        <MetricCard label="Acessos pendentes" value={String(metrics.access_pending ?? 0)} delta="exigem atencao" icon={KeyRound} color="#F59E0B" positive={Number(metrics.access_pending ?? 0) === 0} />
        <MetricCard label="Taxa automatica" value={`${metrics.delivery_rate ?? 0}%`} delta="entregas sem acao manual" icon={Download} color="#22C55E" />
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {["Produto vendido", "Pagamento aprovado", "Acesso liberado", "Cliente recebeu o conteudo"].map((step) => (
          <Card key={step} className="p-4">
            <CheckCircle size={20} className="text-[#22C55E]" />
            <p className="mt-3 font-bold text-[var(--text-primary)]">{step}</p>
          </Card>
        ))}
      </section>
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#FF4D6D]" />
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Ultimas vendas digitais</h2>
        </div>
        {loading ? <p className="text-sm text-[var(--text-secondary)]">Carregando dados...</p> : rows.length ? <DataTable columns={columns} rows={rows} /> : <p className="text-sm text-[var(--text-secondary)]">Voce ainda nao tem vendas digitais.</p>}
      </Card>
    </div>
  );
}
