"use client";

import { CheckCircle, Clock, Package, Route, ShoppingBag, Truck, Warehouse } from "lucide-react";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import { usePhysicalOverview } from "@/lib/hooks/use-physical-overview";

const columns = [
  { key: "order", label: "Pedido" },
  { key: "product", label: "Produto" },
  { key: "total", label: "Total", tone: "accent" as const },
  { key: "status", label: "Status" },
  { key: "action", label: "Acao rapida" },
];

export default function FisicosDashboardPage() {
  const { overview, loading, error } = usePhysicalOverview();
  const rows = Array.isArray(overview?.recent_orders) ? overview.recent_orders : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Painel fisico</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Resumo real da operacao de produtos fisicos, pedidos, estoque e entregas.</p>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard label="Receita fisica" value={`R$ ${Number(overview?.revenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} delta={loading ? "carregando" : error ?? "pedidos pagos"} icon={ShoppingBag} color="#22C55E" />
        <MetricCard label="Pedidos fisicos" value={String(overview?.orders ?? 0)} delta="total do periodo" icon={Package} color="#FF4D6D" />
        <MetricCard label="Aguardando envio" value={String(overview?.awaiting_shipping ?? 0)} delta="preparar agora" icon={Clock} color="#F59E0B" positive={Number(overview?.awaiting_shipping ?? 0) === 0} />
        <MetricCard label="Em transporte" value={String(overview?.in_transit ?? 0)} delta="rastreamento ativo" icon={Truck} color="#38BDF8" />
        <MetricCard label="Baixo estoque" value={String(overview?.low_stock ?? 0)} delta="repor produtos" icon={Warehouse} color="#EF4444" positive={Number(overview?.low_stock ?? 0) === 0} />
        <MetricCard label="Entregues no mes" value={String(overview?.delivered_month ?? 0)} delta="concluidos" icon={CheckCircle} color="#22C55E" />
      </section>
      <section className="grid gap-4 md:grid-cols-5">
        {["Pedido pago", "Separacao", "Etiqueta", "Postagem", "Transporte"].map((title) => (
          <Card key={title} className="p-4">
            <Route size={20} className="text-[#FF4D6D]" />
            <p className="mt-3 font-bold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Etapa operacional real do pedido fisico.</p>
          </Card>
        ))}
      </section>
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-lg font-bold text-[var(--text-primary)]">Pedidos recentes</h2>
        {loading ? <p className="text-sm text-[var(--text-secondary)]">Carregando pedidos...</p> : rows.length ? <DataTable columns={columns} rows={rows} /> : <p className="text-sm text-[var(--text-secondary)]">Nenhum pedido fisico encontrado.</p>}
      </Card>
    </div>
  );
}
