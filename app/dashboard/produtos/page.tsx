"use client";

import { ExternalLink, GripVertical, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteProductDialog from "@/components/dashboard/DeleteProductDialog";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import ProductForm from "@/components/editor/ProductForm";
import { mapApiProduct, mapProductToApi } from "@/lib/api-mappers";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { PRODUCT_TYPE_IDS, PRODUCT_TYPES } from "@/lib/product-types";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function DashboardProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "Ativos" | "Rascunhos" | "Por tipo">("Todos");
  const [typeFilter, setTypeFilter] = useState<Product["type"]>("infoproduto");
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/products", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) =>
        setProducts((payload.data ?? []).map(mapApiProduct).filter((product: Product) => FEATURE_PHYSICAL_PRODUCT || product.type !== "fisico")),
      )
      .catch(() => showToast("Erro ao carregar produtos"));
  }, []);

  const visibleProducts = products.filter((product) => {
    if (!FEATURE_PHYSICAL_PRODUCT && product.type === "fisico") return false;
    if (filter === "Ativos") return (product.status ?? "active") === "active";
    if (filter === "Rascunhos") return product.status === "draft";
    if (filter === "Por tipo") return product.type === typeFilter;
    return true;
  });

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }

  async function saveProduct(product: Product) {
    const editing = Boolean(editingProduct?.id);
    const response = await fetch(editing ? `/api/products/${editingProduct?.id}` : "/api/products", {
      method: editing ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapProductToApi(product)),
    });
    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao salvar produto");
      return;
    }
    const saved = mapApiProduct(payload.data);
    setProducts((current) => editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]);
    setModalOpen(false);
    setEditingProduct(null);
    showToast("Produto salvo");
  }

  async function deleteProduct(id: string) {
    setDeleting(true);
    const response = await fetch(`/api/products/${id}`, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    if (!response.ok) {
      showToast("Erro ao remover produto");
      return;
    }
    setProducts((current) => current.filter((item) => item.id !== id));
    setDeletingProduct(null);
    showToast("Produto removido");
  }

  async function persistOrder(next: Product[]) {
    await fetch("/api/products/reorder", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((item, position) => ({ id: item.id, position })) }),
    });
  }

  function reorderProducts(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    setProducts((current) => {
      const sourceIndex = current.findIndex((product) => product.id === sourceId);
      const targetIndex = current.findIndex((product) => product.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      persistOrder(next).catch(() => showToast("Erro ao salvar ordem"));
      return next;
    });
    showToast("Ordem atualizada");
  }

  function finishDrag() {
    setDraggedProductId(null);
    setDragOverProductId(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Produtos</h1>
        <Button className="w-full sm:w-auto" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
          <Plus size={16} />Novo produto
        </Button>
      </header>

      <div className="scrollbar-hidden flex items-center gap-2 overflow-x-auto pb-1">
        {(["Todos", "Ativos", "Rascunhos", "Por tipo"] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`h-11 shrink-0 rounded-full px-4 text-sm font-bold ${filter === item ? "bg-[#FF4D6D] text-white" : "border border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}>{item}</button>
        ))}
        {filter === "Por tipo" && (
          <select className="input-base h-10 w-auto py-0" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as Product["type"])}>
            {PRODUCT_TYPE_IDS.filter((type) => FEATURE_PHYSICAL_PRODUCT || type !== "fisico").map((type) => <option key={type} value={type}>{PRODUCT_TYPES[type].label}</option>)}
          </select>
        )}
      </div>

      {visibleProducts.length === 0 ? (
        <Card className="grid min-h-80 place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#FF4D6D]/10 text-[#FF4D6D]"><Package size={34} /></div>
            <h2 className="mt-5 font-heading text-xl font-bold text-[var(--text-primary)]">Adicione seu primeiro produto</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Comece vendendo seu primeiro infoproduto.</p>
            <Button className="mt-5" onClick={() => setModalOpen(true)}>Criar produto</Button>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const typeMeta = PRODUCT_TYPES[product.type];
            const TypeIcon = typeMeta.Icon;
            const status = product.status ?? (product.active ? "active" : "hidden");
            return (
              <Card key={product.id} draggable onDragStart={(event) => { setDraggedProductId(product.id); event.dataTransfer.setData("text/plain", product.id); }} onDragOver={(event) => { event.preventDefault(); if (draggedProductId && draggedProductId !== product.id) setDragOverProductId(product.id); }} onDrop={(event) => { event.preventDefault(); const sourceId = event.dataTransfer.getData("text/plain") || draggedProductId; if (sourceId) reorderProducts(sourceId, product.id); finishDrag(); }} onDragEnd={finishDrag} className={`overflow-hidden transition ${draggedProductId === product.id ? "scale-[0.98] opacity-40" : ""} ${dragOverProductId === product.id ? "border-t-2 border-t-[#FF4D6D]" : ""}`}>
                <div
                  className="relative flex aspect-[1.5] items-center justify-center overflow-hidden bg-[var(--bg-elevated)] font-heading text-xl font-extrabold text-white"
                  style={{ background: product.coverImage ? "var(--bg-elevated)" : `linear-gradient(135deg, ${product.coverGradient?.[0] ?? typeMeta.gradient[0]}, ${product.coverGradient?.[1] ?? typeMeta.gradient[1]})` }}
                >
                  <GripVertical className="absolute left-3 top-3 cursor-grab text-white/60" size={18} />
                  {product.coverImage ? <img src={product.coverImage} alt="" className="size-full object-contain p-3" /> : typeMeta.label}
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">{product.name}</h2>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold" style={{ color: typeMeta.color, backgroundColor: `${typeMeta.color}18` }}>
                        <TypeIcon size={13} />{typeMeta.label}
                      </span>
                    </div>
                    <Badge tone={status === "active" ? "success" : status === "draft" ? "warning" : "neutral"}>{status === "active" ? "Ativo" : status === "draft" ? "Rascunho" : "Oculto"}</Badge>
                  </div>
                  <p className="text-xl font-extrabold text-[var(--text-primary)]">{formatPrice(product.price)}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => { setEditingProduct(product); setModalOpen(true); }}><Pencil size={16} />Editar</Button>
                    <a href={`/dashboard`} target="_blank" rel="noreferrer"><Button variant="secondary"><ExternalLink size={16} /></Button></a>
                    <Button variant="secondary" onClick={() => setDeletingProduct(product)}><Trash2 size={16} /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      <Modal open={modalOpen} title={editingProduct ? "Editar produto" : "Novo produto"} onClose={() => setModalOpen(false)} maxWidth="max-w-[680px]">
        <ProductForm initialProduct={editingProduct ?? undefined} products={products} onCancel={() => setModalOpen(false)} onSave={saveProduct} />
      </Modal>
      <DeleteProductDialog
        open={!!deletingProduct}
        productName={deletingProduct?.name ?? ""}
        loading={deleting}
        onConfirm={() => deletingProduct && deleteProduct(deletingProduct.id)}
        onCancel={() => setDeletingProduct(null)}
      />
      <Toast message={toast} />
    </div>
  );
}
