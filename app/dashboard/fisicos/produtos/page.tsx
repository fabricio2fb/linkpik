"use client";

import Link from "next/link";
import { AlertCircle, Package, PackagePlus, Star, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import DataTable from "@/components/dashboard/DataTable";
import InsightCard from "@/components/dashboard/InsightCard";
import { usePhysicalProducts } from "@/lib/hooks/use-physical-products";

const columns = [
  { key: "product", label: "Produto" },
  { key: "price", label: "Preco", tone: "accent" as const },
  { key: "stock", label: "Estoque" },
  { key: "weight", label: "Peso" },
  { key: "size", label: "Medidas" },
  { key: "sales", label: "Vendas" },
  { key: "revenue", label: "Receita", tone: "accent" as const },
  { key: "status", label: "Status" },
  { key: "action", label: "Acoes" },
];

export default function ProdutosFisicosModulePage() {
  const { products, loading, error } = usePhysicalProducts();
  const rows = products as Record<string, string | number>[];
  const tableRows = rows.map((row) => ({
    ...row,
    action: (
      <Link href={`/dashboard/fisicos/produtos/${row.id}/editar`} className="font-bold text-[#FF4D6D] transition hover:text-[#FF2D55]">
        Editar
      </Link>
    ),
  }));
  const active = rows.filter((row) => row.status === "Ativo").length;
  const lowStock = rows.filter((row) => Number(row.stock) <= 5).length;
  const bestSeller = rows.slice().sort((a, b) => Number(b.sales) - Number(a.sales))[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Produtos fisicos</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Cadastre produtos com estoque, peso, medidas e entrega.</p>
        </div>
        <Link href="/dashboard/fisicos/produtos/novo">
          <Button><PackagePlus size={16} />Novo produto fisico</Button>
        </Link>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Produtos fisicos" value={String(rows.length)} delta="total cadastrado" icon={Package} color="#FF4D6D" />
        <MetricCard label="Ativos" value={String(active)} delta="publicados" icon={PackagePlus} color="#22C55E" />
        <MetricCard label="Baixo estoque" value={String(lowStock)} delta="revisar estoque" icon={AlertCircle} color="#F59E0B" positive={lowStock === 0} />
        <MetricCard label="Mais vendido" value={bestSeller ? String(bestSeller.sales) : "0"} delta={bestSeller?.product ? String(bestSeller.product) : "sem vendas"} icon={Star} color="#38BDF8" />
        <MetricCard label="Receita destaque" value={bestSeller ? String(bestSeller.revenue) : "R$ 0,00"} delta="maior produto" icon={TrendingUp} color="#22C55E" />
      </section>
      {rows.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          <InsightCard icon={Star} title="Mais vendido" text={bestSeller ? `${bestSeller.product} lidera com ${bestSeller.sales} vendas.` : "Ainda sem vendas fisicas."} color="#FF4D6D" />
          <InsightCard icon={AlertCircle} title="Estoque" text={lowStock ? `${lowStock} produto(s) precisam de reposicao.` : "Nenhum produto em baixo estoque."} color="#F59E0B" />
          <InsightCard icon={TrendingUp} title="Receita" text="Receita calculada somente a partir de pedidos pagos." color="#22C55E" />
        </section>
      )}
      <Card className="p-1">
        {error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-4 text-sm text-[var(--text-secondary)]">Carregando produtos...</div>
        ) : rows.length > 0 ? (
          <DataTable columns={columns} rows={tableRows} />
        ) : (
          <div className="grid min-h-60 place-items-center p-6 text-center">
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Voce ainda nao cadastrou produtos fisicos</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Crie seu primeiro produto fisico com estoque, frete e rastreamento.</p>
              <Link href="/dashboard/fisicos/produtos/novo">
                <Button className="mt-5"><PackagePlus size={16} />Criar produto fisico</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
