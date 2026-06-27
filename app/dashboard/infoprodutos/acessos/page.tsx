"use client";

import { KeyRound, Mail, ShieldCheck, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import type { TableColumn } from "@/lib/dashboard/types";

type AccessRow = Record<string, string | number>;

export default function AcessosLiberadosPage() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccess, setSelectedAccess] = useState<AccessRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/infoprodutos/acessos?limit=50", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setRows(payload.data?.accesses ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const released = rows.filter((row) => row.status === "Liberado").length;
  const expired = rows.filter((row) => row.status === "Expirado").length;

  async function resendAccess(row: AccessRow) {
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
    { key: "customer", label: "Cliente" },
    { key: "product", label: "Produto" },
    { key: "email", label: "Email" },
    { key: "token", label: "Token mascarado" },
    { key: "status", label: "Status" },
    { key: "released_at", label: "Liberado em" },
    { key: "last_access", label: "Ultimo acesso" },
    {
      key: "action",
      label: "Acoes",
      render: (row) => {
        const access = row as AccessRow;
        const orderId = String(access.order_id ?? "");
        return (
          <div className="flex flex-wrap justify-end gap-2 md:justify-start">
            <Button className="min-h-9 px-3 text-xs" variant="secondary" onClick={() => setSelectedAccess(access)}>
              Ver acesso
            </Button>
            <Button className="min-h-9 px-3 text-xs" onClick={() => resendAccess(access)} disabled={!orderId || resendingOrderId === orderId}>
              {resendingOrderId === orderId ? "Enviando..." : "Reenviar acesso"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Acessos liberados</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Controle links, tokens e entregas digitais dos clientes.</p>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Liberados" value={String(released)} delta="tokens ativos" icon={KeyRound} color="#22C55E" />
        <MetricCard label="Expirados" value={String(expired)} delta="fora do prazo" icon={TimerReset} color="#F59E0B" positive={expired === 0} />
        <MetricCard label="Total" value={String(rows.length)} delta="acessos criados" icon={ShieldCheck} color="#38BDF8" />
        <MetricCard label="Privacidade" value="Ok" delta="tokens mascarados" icon={Mail} color="#FF4D6D" />
      </section>
      <Card className="p-1">
        {loading ? <div className="p-4 text-sm text-[var(--text-secondary)]">Carregando acessos...</div> : rows.length ? <DataTable columns={columns} rows={rows} /> : <div className="p-4 text-sm text-[var(--text-secondary)]">Nenhum acesso liberado ainda.</div>}
      </Card>
      {actionMessage && <Card className="p-4 text-sm font-semibold text-[var(--text-primary)]">{actionMessage}</Card>}
      <Modal open={Boolean(selectedAccess)} title="Detalhes do acesso" onClose={() => setSelectedAccess(null)}>
        {selectedAccess && (
          <div className="grid gap-3 p-5 text-sm">
            <Detail label="Cliente" value={String(selectedAccess.customer)} />
            <Detail label="Produto" value={String(selectedAccess.product)} />
            <Detail label="Email" value={String(selectedAccess.email)} />
            <Detail label="Token" value={String(selectedAccess.token)} />
            <Detail label="Status" value={String(selectedAccess.status)} />
            <Detail label="Liberado em" value={String(selectedAccess.released_at)} />
            <Detail label="Ultimo acesso" value={String(selectedAccess.last_access)} />
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
