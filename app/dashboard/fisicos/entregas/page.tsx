"use client";

import { AlertCircle, CheckCircle, Package, Tag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import Timeline from "@/components/dashboard/Timeline";
import type { KanbanColumn } from "@/lib/dashboard/types";

export default function EntregasFisicasPage() {
  const [data, setData] = useState<{ metrics?: Record<string, number>; columns?: KanbanColumn[]; timeline?: Array<{ title: string }> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/fisicos/entregas", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setData(payload.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics ?? {};
  const columns = data?.columns ?? [];
  const timeline = data?.timeline?.map((step) => step.title) ?? [];
  const totalCards = columns.reduce((sum, column) => sum + column.cards.length, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Entregas</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Gerencie preparacao, postagem e acompanhamento dos produtos fisicos enviados por voce.</p>
      </header>
      <Card className="border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">Voce posta o produto por conta propria.</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          Quando postar o pedido, informe o codigo de rastreio para atualizar a linha do tempo do cliente.
        </p>
      </Card>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard label="Aguardando preparo" value={String(metrics.awaiting_preparation ?? 0)} delta="fila real" color="#F59E0B" icon={Package} />
        <MetricCard label="Etiquetas geradas" value={String(metrics.label_generated ?? 0)} delta="aguardam postagem" color="#38BDF8" icon={Tag} />
        <MetricCard label="Postados hoje" value={String(metrics.posted_today ?? 0)} delta="manual" color="#FF4D6D" icon={Truck} />
        <MetricCard label="Em transporte" value={String(metrics.in_transit ?? 0)} delta="rastreamento ativo" color="#FF4D6D" icon={Truck} />
        <MetricCard label="Entregues" value={String(metrics.delivered_week ?? 0)} delta="concluidos" color="#22C55E" icon={CheckCircle} />
        <MetricCard label="Problemas" value={String(metrics.issues ?? 0)} delta="exige acao" color="#EF4444" icon={AlertCircle} positive={Number(metrics.issues ?? 0) === 0} />
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Kanban de entregas</h2>
        {loading ? <Card className="p-5 text-sm text-[var(--text-secondary)]">Carregando entregas...</Card> : totalCards ? <KanbanBoard columns={columns} /> : <Card className="p-5 text-sm text-[var(--text-secondary)]">Nenhuma entrega em andamento.</Card>}
      </section>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Timeline detalhada</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Eventos reais do envio mais recente.</p>
        <div className="mt-5">
          {timeline.length ? <Timeline steps={timeline} activeIndex={timeline.length - 1} /> : <p className="text-sm text-[var(--text-secondary)]">Nenhum evento de entrega registrado.</p>}
        </div>
      </Card>
    </div>
  );
}
