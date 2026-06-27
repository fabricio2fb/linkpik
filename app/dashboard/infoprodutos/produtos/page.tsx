"use client";

import Link from "next/link";
import { FileArchive, Layers, Plus, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import InsightCard from "@/components/dashboard/InsightCard";

const columns = [
  { key: "product", label: "Produto" },
  { key: "delivery", label: "Tipo de entrega" },
  { key: "price", label: "Preco", tone: "accent" as const },
  { key: "sales", label: "Vendas" },
  { key: "revenue", label: "Receita", tone: "accent" as const },
  { key: "status", label: "Status" },
  { key: "last_sale", label: "Ultima venda" },
  { key: "action", label: "Acoes" },
];

export default function ProdutosDigitaisPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/infoprodutos/produtos?limit=50", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setRows(payload.data?.products ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const tableRows = rows.map((row) => ({
    ...row,
    action: (
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/infoprodutos/produtos/${row.id}/editar`} className="font-bold text-[#FF4D6D] transition hover:text-[#FF2D55]">
          Editar
        </Link>
        <Link href={`/dashboard/infoprodutos/produtos/${row.id}/pagina`} className="inline-flex items-center gap-1 font-bold text-[var(--text-secondary)] transition hover:text-[#FF4D6D]">
          <Layers size={14} />
          Pagina
        </Link>
      </div>
    ),
  }));
  const active = rows.filter((row) => row.status === "Ativo").length;
  const drafts = rows.filter((row) => row.status === "Rascunho").length;
  const bestSeller = rows.slice().sort((a, b) => Number(b.sales) - Number(a.sales))[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Produtos digitais</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Gerencie infoprodutos, arquivos, links e entregas automaticas.</p>
        </div>
        <Link href="/dashboard/infoprodutos/produtos/novo">
          <Button><Plus size={16} />Novo infoproduto</Button>
        </Link>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Ativos" value={String(active)} delta="produtos publicados" icon={FileArchive} color="#22C55E" />
        <MetricCard label="Rascunhos" value={String(drafts)} delta="em preparo" icon={FileArchive} color="#F59E0B" positive={drafts === 0} />
        <MetricCard label="Mais vendido" value={bestSeller ? String(bestSeller.sales) : "0"} delta={bestSeller?.product ?? "sem vendas"} icon={Star} color="#FF4D6D" />
        <MetricCard label="Produtos digitais" value={String(rows.length)} delta="total cadastrado" icon={TrendingUp} color="#38BDF8" />
      </section>
      {rows.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          <InsightCard icon={Star} title="Mais vendido" text={bestSeller ? `${bestSeller.product} lidera em vendas.` : "Ainda sem produto lider."} color="#FF4D6D" />
          <InsightCard icon={FileArchive} title="Entrega digital" text="Produtos pagos liberam acesso via access tokens seguros." color="#38BDF8" />
          <InsightCard icon={TrendingUp} title="Receita digital" text="Receita calculada a partir dos pedidos pagos." color="#22C55E" />
        </section>
      )}
      <Card className="p-1">
        {loading ? <div className="p-4 text-sm text-[var(--text-secondary)]">Carregando produtos...</div> : rows.length ? <DataTable columns={columns} rows={tableRows} /> : (
          <div className="grid min-h-60 place-items-center p-6 text-center">
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Voce ainda nao cadastrou infoprodutos</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Crie seu primeiro produto digital e venda com entrega automatica.</p>
              <Link href="/dashboard/infoprodutos/produtos/novo">
                <Button className="mt-5"><Plus size={16} />Criar infoproduto</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
