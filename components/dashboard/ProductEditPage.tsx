"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import DeleteProductDialog from "@/components/dashboard/DeleteProductDialog";
import ProductForm from "@/components/editor/ProductForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { mapApiProduct, mapProductToApi } from "@/lib/api-mappers";
import type { Product } from "@/lib/types";

type ProductEditPageProps = {
  productId: string;
  title: string;
  description: string;
  productKind: "digital" | "physical";
  backHref: string;
};

export default function ProductEditPage({ productId, title, description, productKind, backHref }: ProductEditPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [productResponse, productsResponse] = await Promise.all([
          fetch(`/api/products/${productId}`, { credentials: "include", cache: "no-store" }),
          fetch("/api/products", { credentials: "include", cache: "no-store" }),
        ]);
        const productPayload = await productResponse.json();
        const productsPayload = await productsResponse.json();
        if (!productResponse.ok) throw new Error(productPayload.error ?? "Produto nao encontrado");
        setProduct(mapApiProduct(productPayload.data));
        setProducts((productsPayload.data ?? []).map(mapApiProduct));
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function deleteProduct() {
    setSaving(true);
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao excluir produto.");
      return;
    }
    setShowDeleteDialog(false);
    showToast("Produto excluido");
    router.push(backHref);
    router.refresh();
  }

  async function saveProduct(nextProduct: Product) {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapProductToApi(nextProduct)),
    });
    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao salvar produto.");
      return;
    }
    showToast("Produto atualizado");
    router.push(backHref);
    router.refresh();
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
        <div className="flex gap-2">
          {product && (
            <Button variant="secondary" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 size={16} />
              Excluir
            </Button>
          )}
          <Link href={backHref}>
            <Button variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
          </Link>
        </div>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-5 text-sm text-[var(--text-secondary)]">Carregando produto...</div>
        ) : product ? (
          <ProductForm
            initialProduct={product}
            products={products}
            mode="edit"
            productKind={productKind}
            lockedKind
            onCancel={() => router.push(backHref)}
            onSave={saveProduct}
          />
        ) : (
          <div className="p-5 text-sm text-red-400">Produto nao encontrado.</div>
        )}
      </Card>
      <DeleteProductDialog
        open={showDeleteDialog}
        productName={product?.name ?? ""}
        loading={saving}
        onConfirm={deleteProduct}
        onCancel={() => setShowDeleteDialog(false)}
      />
      <Toast message={toast} />
    </div>
  );
}
