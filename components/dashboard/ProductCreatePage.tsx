"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import ProductForm from "@/components/editor/ProductForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { mapApiProduct, mapProductToApi } from "@/lib/api-mappers";
import type { Product } from "@/lib/types";

type ProductCreatePageProps = {
  title: string;
  description: string;
  productKind: "digital" | "physical";
  backHref: string;
  successMessage: string;
};

export default function ProductCreatePage({ title, description, productKind, backHref, successMessage }: ProductCreatePageProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setProducts((payload.data ?? []).map(mapApiProduct)))
      .catch(() => showToast("Nao foi possivel carregar seus produtos."));
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function saveProduct(product: Product) {
    const response = await fetch("/api/products", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapProductToApi(product)),
    });
    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao salvar produto.");
      return;
    }

    const mappedProduct = mapApiProduct(payload.data);
    setCreatedProduct(mappedProduct);
    setCreatedProductId(mappedProduct.id);
    showToast(successMessage);
    router.refresh();
  }

  if (createdProductId && createdProduct) {
    return (
      <div className="relative grid min-h-[calc(100vh-180px)] place-items-center overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 bg-[radial-gradient(circle_at_center,rgba(255,77,109,0.12),transparent_62%)]" />
        <Card className="relative w-full max-w-2xl animate-[successIn_260ms_ease-out] overflow-hidden p-0 text-left">
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-6 text-center sm:p-8">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mt-5 font-heading text-2xl font-extrabold text-[var(--text-primary)]">{successMessage}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              Produto salvo com entrega automatica. Agora o melhor proximo passo e deixar a pagina pronta para vender.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
              <div className="flex items-center gap-4">
                <div
                  className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[12px] text-xs font-bold text-white"
                  style={{ background: createdProduct.coverImage ? "var(--bg-elevated)" : `linear-gradient(135deg, ${createdProduct.coverGradient?.[0] ?? "#FF4D6D"}, ${createdProduct.coverGradient?.[1] ?? "#7C3AED"})` }}
                >
                  {createdProduct.coverImage ? (
                    <img src={createdProduct.coverImage} alt="" className="size-full object-cover" />
                  ) : (
                    "Produto"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Produto criado</p>
                  <h2 className="mt-1 truncate font-heading text-lg font-bold text-[var(--text-primary)]">{createdProduct.name}</h2>
                  <p className="mt-2 text-xl font-extrabold text-[#FF4D6D]">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(createdProduct.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
              <Link href={backHref}>
                <Button variant="ghost" className="w-full border border-[var(--border-subtle)]">Ir para o painel</Button>
              </Link>
              <Link href={`/dashboard/infoprodutos/produtos/${createdProductId}/pagina`}>
                <Button className="w-full"><Layers size={16} />Personalizar pagina</Button>
              </Link>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-[var(--text-tertiary)]">
              Voce pode personalizar a pagina quando quiser, a partir da lista de produtos.
            </p>
          </div>
        </Card>
        <style jsx>{`
          @keyframes successIn {
            from {
              opacity: 0;
              transform: scale(0.97) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-[var(--text-primary)]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        <Link href={backHref}>
          <Button variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
        </Link>
      </header>

      <Card className="overflow-hidden">
        <ProductForm
          products={products}
          productKind={productKind}
          lockedKind
          onCancel={() => router.push(backHref)}
          onSave={saveProduct}
        />
      </Card>
      <Toast message={toast} />
    </div>
  );
}
