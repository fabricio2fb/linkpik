"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle, Download, PackagePlus, TrendingUp, Warehouse } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import ActionAlert from "@/components/dashboard/ActionAlert";
import InsightCard from "@/components/dashboard/InsightCard";
import InventoryAdjustmentModal from "@/components/dashboard/InventoryAdjustmentModal";
import { useInventory } from "@/lib/hooks/use-inventory";

const columns = [
  { key: "product", label: "Produto" },
  { key: "sku", label: "SKU" },
  { key: "current", label: "Estoque atual" },
  { key: "minimum", label: "Estoque minimo" },
  { key: "sold7", label: "Vendidos 7 dias" },
  { key: "sold30", label: "Vendidos 30 dias" },
  { key: "coverage", label: "Cobertura estimada" },
  { key: "status", label: "Status" },
  { key: "lastSale", label: "Ultima venda" },
  { key: "action", label: "Acoes" },
];

export default function EstoqueFisicoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { products, summary, loading, error, reload } = useInventory();
  const rows = products as Record<string, string | number>[];
  const restockProduct = rows.find((product) => product.status === "Baixo estoque" || product.status === "Esgotado");
  const alerts = rows.filter((product) => product.status !== "Ok").map((product) => ({
    title: `${product.product} precisa de atencao`,
    text: product.status === "Esgotado" ? "Produto sem estoque." : "Estoque abaixo do minimo configurado.",
    tone: product.status === "Esgotado" ? "danger" as const : "warning" as const,
    action: "Ajustar",
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Estoque</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Controle disponibilidade, reposicao e risco de ruptura dos seus produtos fisicos.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary"><Download size={16} />Exportar estoque</Button>
          <Link href="/dashboard/fisicos/produtos/novo">
            <Button><PackagePlus size={16} />Adicionar produto fisico</Button>
          </Link>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Itens em estoque" value={String(summary?.total_units ?? 0)} delta={`${summary?.active_products ?? 0} produtos`} icon={Warehouse} color="#22C55E" />
        <MetricCard label="Baixo estoque" value={String(summary?.low_stock ?? 0)} delta="precisam de reposicao" icon={AlertCircle} color="#F59E0B" positive={Number(summary?.low_stock ?? 0) === 0} />
        <MetricCard label="Esgotados" value={String(summary?.sold_out ?? 0)} delta="vendas pausadas" icon={AlertCircle} color="#EF4444" positive={Number(summary?.sold_out ?? 0) === 0} />
        <MetricCard label="Cobertura" value="Real" delta="sem dados inventados" icon={TrendingUp} color="#38BDF8" />
      </section>
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Atencao necessaria</h2>
          <div className="grid gap-3 xl:grid-cols-3">
            {alerts.map((alert) => <ActionAlert key={alert.title} alert={alert} />)}
          </div>
        </section>
      )}
      {error && <Card className="p-4 text-sm text-red-400">{error}</Card>}
      {loading ? (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">Carregando estoque...</Card>
      ) : rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">Nenhum produto fisico com controle de estoque.</Card>
      )}
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Resumo de reposicao</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InsightCard icon={AlertCircle} title="Produtos para repor" text={alerts.length ? `${alerts.length} produto(s) exigem acao.` : "Nenhum produto precisa de reposicao agora."} color="#F59E0B" />
            <InsightCard icon={CheckCircle} title="Produtos saudaveis" text={`${rows.filter((row) => row.status === "Ok").length} produto(s) com estoque adequado.`} color="#22C55E" />
            <InsightCard icon={TrendingUp} title="Historico" text="Cobertura estimada depende de vendas reais dos pedidos pagos." color="#38BDF8" />
          </div>
        </Card>
        <Card className="p-5">
          <TrendingUp className="text-[#FF4D6D]" size={22} />
          <h2 className="mt-3 font-heading text-lg font-bold text-[var(--text-primary)]">Sugestao</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{restockProduct ? `Repor ${restockProduct.product} antes de novas campanhas.` : "Seu estoque fisico nao exige reposicao imediata."}</p>
          <Button className="mt-4 w-full" onClick={() => setModalOpen(true)} disabled={!restockProduct}>Repor produto</Button>
        </Card>
      </section>
      <InventoryAdjustmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={restockProduct ? String(restockProduct.product) : undefined}
        productId={restockProduct ? String(restockProduct.id) : undefined}
        currentStock={restockProduct ? `${restockProduct.current ?? 0} unidades` : undefined}
        onSaved={reload}
      />
    </div>
  );
}
