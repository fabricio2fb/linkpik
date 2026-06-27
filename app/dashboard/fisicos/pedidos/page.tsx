"use client";

import { AlertCircle, CheckCircle, Clock, PackageCheck, Plus, Truck } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import OrderDetailDrawer from "@/components/dashboard/OrderDetailDrawer";
import { usePhysicalOrders } from "@/lib/hooks/use-physical-orders";

const columns = [
  { key: "order", label: "Pedido" },
  { key: "customer", label: "Cliente" },
  { key: "product", label: "Produto" },
  { key: "total", label: "Total", tone: "accent" as const },
  { key: "shipping", label: "Frete" },
  { key: "status", label: "Status" },
  { key: "tracking", label: "Rastreio" },
  { key: "action", label: "Proxima acao" },
];

export default function PedidosFisicosPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { orders, loading, error } = usePhysicalOrders();
  const rows = orders as Record<string, string | number>[];
  const awaiting = rows.filter((row) => ["Preparando envio", "Aguardando etiqueta", "Etiqueta gerada", "Aguardando postagem"].includes(String(row.status))).length;
  const inTransit = rows.filter((row) => row.status === "Em transporte").length;
  const delivered = rows.filter((row) => row.status === "Entregue").length;
  const issues = rows.filter((row) => row.status === "Problema na entrega").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Pedidos fisicos</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Acompanhe pedidos pagos que precisam de preparacao, envio e rastreamento manual pelo criador.</p>
        </div>
        <Button variant="secondary"><Plus size={16} />Criar pedido manual</Button>
      </header>
      <Card className="border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">O envio e responsabilidade do criador.</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          Embale e poste o pedido pelos Correios ou transportadora de sua preferencia. Depois, adicione o codigo de rastreio para o cliente acompanhar.
        </p>
      </Card>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Pedidos" value={String(rows.length)} delta="listados" icon={PackageCheck} color="#FF4D6D" />
        <MetricCard label="Aguardando envio" value={String(awaiting)} delta="precisam de acao" icon={Clock} color="#F59E0B" positive={awaiting === 0} />
        <MetricCard label="Em transporte" value={String(inTransit)} delta="rastreio ativo" icon={Truck} color="#38BDF8" />
        <MetricCard label="Entregues" value={String(delivered)} delta="concluidos" icon={CheckCircle} color="#22C55E" />
        <MetricCard label="Problemas" value={String(issues)} delta="acompanhar" icon={AlertCircle} color="#EF4444" positive={issues === 0} />
      </section>
      <Card className="p-1">
        {error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-4 text-sm text-[var(--text-secondary)]">Carregando pedidos...</div>
        ) : rows.length ? (
          <DataTable columns={columns} rows={rows} onRowClick={(row) => setSelectedOrderId(String(row.id ?? ""))} />
        ) : (
          <div className="p-4 text-sm text-[var(--text-secondary)]">Nenhum pedido fisico encontrado.</div>
        )}
      </Card>
      <OrderDetailDrawer orderId={selectedOrderId} open={!!selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
}
