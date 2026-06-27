"use client";

import { Copy, Mail, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import type { TableColumn } from "@/lib/dashboard/types";

type DigitalSaleRow = Record<string, string | number | boolean>;

export default function VendasDigitaisPage() {
  const [rows, setRows] = useState<DigitalSaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DigitalSaleRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/infoprodutos/vendas?limit=50&period=30", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setRows(payload.data?.sales ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const paid = rows.filter((row) => row.payment_status === "Pago");
  const released = rows.filter((row) => row.access_status === "Acesso liberado");

  async function resendAccess(row: DigitalSaleRow) {
    const orderId = String(row.order_id ?? "");
    if (!orderId) return;
    setActionMessage(null);
    setResendingOrderId(orderId);
    try {
      const response = await fetch("/api/dashboard/infoprodutos/access/resend", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Nao conseguimos reenviar o acesso.");
      setActionMessage("Acesso reenviado para o comprador.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Nao conseguimos reenviar o acesso.");
    } finally {
      setResendingOrderId(null);
    }
  }

  const columns: TableColumn[] = [
    { key: "order", label: "Pedido" },
    { key: "customer", label: "Cliente" },
    { key: "product", label: "Produto" },
    { key: "value", label: "Valor", tone: "accent" as const },
    { key: "payment_status", label: "Pagamento" },
    { key: "access_status", label: "Acesso" },
    { key: "channel", label: "Canal" },
    { key: "date", label: "Data" },
    {
      key: "action",
      label: "Acoes",
      render: (row) => {
        const order = row as DigitalSaleRow;
        const canResend = Boolean(order.can_resend_access);
        const orderId = String(order.order_id ?? "");
        return (
          <div className="flex flex-wrap justify-end gap-2 md:justify-start">
            <Button className="min-h-9 px-3 text-xs" variant="secondary" onClick={() => setSelectedOrder(order)}>
              Ver pedido
            </Button>
            {canResend && (
              <Button className="min-h-9 px-3 text-xs" onClick={() => resendAccess(order)} disabled={resendingOrderId === orderId}>
                {resendingOrderId === orderId ? "Enviando..." : "Reenviar acesso"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Vendas digitais</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Acompanhe vendas de infoprodutos e liberacao automatica de acesso.</p>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Vendas no mes" value={String(paid.length)} delta="pedidos pagos" icon={ShoppingBag} color="#FF4D6D" />
        <MetricCard label="Pedidos listados" value={String(rows.length)} delta="ultimos 30 dias" icon={TrendingUp} color="#38BDF8" />
        <MetricCard label="Acessos liberados" value={String(released.length)} delta="entregas digitais" icon={Mail} color="#22C55E" />
        <MetricCard label="Pendentes" value={String(rows.length - released.length)} delta="revisar se pago" icon={Mail} color="#F59E0B" positive={rows.length === released.length} />
        <MetricCard label="Canal" value="MP" delta="Mercado Pago" icon={Copy} color="#22C55E" />
      </section>
      <Card className="p-1">
        {loading ? <div className="p-4 text-sm text-[var(--text-secondary)]">Carregando vendas...</div> : rows.length ? <DataTable columns={columns} rows={rows} /> : <div className="p-4 text-sm text-[var(--text-secondary)]">Nenhuma venda digital encontrada.</div>}
      </Card>
      {actionMessage && <Card className="p-4 text-sm font-semibold text-[var(--text-primary)]">{actionMessage}</Card>}
      <Modal open={Boolean(selectedOrder)} title="Detalhes do pedido" onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div className="grid gap-3 p-5 text-sm">
            <Detail label="Pedido" value={`#${selectedOrder.order}`} />
            <Detail label="Produto" value={String(selectedOrder.product)} />
            <Detail label="Comprador" value={String(selectedOrder.customer)} />
            <Detail label="Email" value={String(selectedOrder.buyer_email)} />
            <Detail label="Valor" value={String(selectedOrder.value)} />
            <Detail label="Pagamento" value={String(selectedOrder.payment_status)} />
            <Detail label="Acesso" value={String(selectedOrder.access_status)} />
            <Detail label="Data" value={String(selectedOrder.date)} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
      <span className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{label}</span>
      <span className="text-right font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
