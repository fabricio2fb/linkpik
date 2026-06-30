"use client";

import Image from "next/image";
import { Copy, ExternalLink, Eye, EyeOff, GripVertical, ImagePlus, Package, Pencil, Plus, Star, Trash2, Video, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteProductDialog from "@/components/dashboard/DeleteProductDialog";
import { Input, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ProductForm from "@/components/editor/ProductForm";
import ThemeEditor from "@/components/editor/ThemeEditor";
import { mapApiProduct, mapProductToApi } from "@/lib/api-mappers";
import type { Creator, CreatorLink, LinkType, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { isValidPresentationVideoUrl } from "@/components/store/PresentationVideo";
import { uploadSignedCloudinaryImage, validateImageFile } from "@/lib/client/cloudinary-upload";
import { LINK_TYPE_IDS, LINK_TYPES, normalizeLinkUrl, validateLinkValue } from "@/lib/link-types";

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

type StoreEditorProps = {
  creator: Creator;
  products: Product[];
  theme: StoreTheme;
  onThemeChange: (theme: StoreTheme) => void;
  onCreatorChange: (creator: Creator) => void;
  onProductsChange: (products: Product[]) => void;
  onToast: (message: string) => void;
};

export default function StoreEditor({
  creator,
  products,
  theme,
  onThemeChange,
  onCreatorChange,
  onProductsChange,
  onToast,
}: StoreEditorProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  function updateCreator<K extends keyof Creator>(key: K, value: Creator[K]) {
    onCreatorChange({ ...creator, [key]: value });
  }

  function startCreateProduct() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function upsertProduct(product: Product) {
    const exists = products.some((item) => item.id === product.id);
    const response = await fetch(exists ? `/api/products/${product.id}` : "/api/products", {
      method: exists ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapProductToApi(product)),
    });
    const payload = await response.json();
    if (!response.ok) {
      onToast(payload.error ?? "Erro ao salvar produto");
      return;
    }
    const saved = mapApiProduct(payload.data);
    onProductsChange(exists ? products.map((item) => (item.id === saved.id ? saved : item)) : [...products, saved]);
    setModalOpen(false);
    setEditingProduct(null);
    onToast(exists ? "Produto atualizado" : "Produto criado");
  }

  async function readCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverUploadError("");
    const fileError = validateImageFile(file, 8 * 1024 * 1024);
    if (fileError) {
      setCoverUploadError(fileError);
      event.target.value = "";
      return;
    }

    setCoverUploading(true);
    try {
      const uploaded = await uploadSignedCloudinaryImage({ file, uploadType: "store_banner" });
      updateCreator("coverImage", uploaded.url);
      onToast("Imagem de capa enviada");
    } catch (error) {
      setCoverUploadError(error instanceof Error ? error.message : "Nao conseguimos enviar a imagem agora.");
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  }

  async function readAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploadError("");
    const fileError = validateImageFile(file, 2 * 1024 * 1024);
    if (fileError) {
      setAvatarUploadError(fileError);
      event.target.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      const uploaded = await uploadSignedCloudinaryImage({ file, uploadType: "creator_avatar" });
      updateCreator("avatarImage", uploaded.url);
      onToast("Foto de perfil enviada");
    } catch (error) {
      setAvatarUploadError(error instanceof Error ? error.message : "Nao conseguimos enviar a imagem agora.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  }

  const videoUrl = creator.presentationVideo?.url ?? "";
  const videoEnabled = creator.presentationVideo !== null && creator.presentationVideo !== undefined;
  const videoInvalid = videoEnabled && videoUrl.length > 0 && !isValidPresentationVideoUrl(videoUrl);

  async function copyBioLink() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "https://pik.bio");
    const url = `${baseUrl.replace(/\/$/, "")}/${creator.username || "seu-usuario"}`;
    await navigator.clipboard?.writeText(url);
    onToast("Link da bio copiado");
  }

  function startLink(type: LinkType) {
    setSelectedLinkType(type);
    setEditingLinkId(null);
    setLinkLabel(LINK_TYPES[type].label);
    setLinkValue("");
    setLinkError("");
  }

  function editLink(link: CreatorLink) {
    setEditingLinkId(link.id);
    setSelectedLinkType(link.type);
    setLinkLabel(link.label);
    setLinkValue(
      link.type === "email"
        ? link.url.replace(/^mailto:/, "")
        : link.type === "whatsapp"
          ? link.url.replace(/\D/g, "")
          : link.url,
    );
    setLinkError("");
    setLinkPickerOpen(true);
  }

  function resetLinkForm() {
    setLinkPickerOpen(false);
    setSelectedLinkType(null);
    setEditingLinkId(null);
    setLinkLabel("");
    setLinkValue("");
    setLinkError("");
  }

  async function saveLink() {
    if (!selectedLinkType) return;
    if (!validateLinkValue(selectedLinkType, linkValue)) {
      setLinkError(
        selectedLinkType === "whatsapp"
          ? "WhatsApp deve ter apenas números e pelo menos 10 dígitos"
          : selectedLinkType === "email"
            ? "Email inválido"
            : "URL deve começar com https://",
      );
      return;
    }
    const normalizedUrl = normalizeLinkUrl(selectedLinkType, linkValue);
    const response = await fetch(editingLinkId ? `/api/links/${editingLinkId}` : "/api/links", {
      method: editingLinkId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: selectedLinkType,
        label: linkLabel.trim() || LINK_TYPES[selectedLinkType].label,
        url: normalizedUrl,
        ...(editingLinkId ? {} : { position: creator.links?.length ?? 0, is_active: true }),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      onToast(payload.error ?? "Erro ao adicionar link");
      return;
    }
    const nextLink: CreatorLink = {
      id: payload.data.id,
      type: selectedLinkType,
      label: linkLabel.trim() || LINK_TYPES[selectedLinkType].label,
      url: normalizedUrl,
      active: payload.data.is_active ?? true,
    };
    updateCreator(
      "links",
      editingLinkId
        ? (creator.links ?? []).map((link) => (link.id === editingLinkId ? nextLink : link))
        : [...(creator.links ?? []), nextLink],
    );
    resetLinkForm();
    onToast(editingLinkId ? "Link atualizado" : "Link adicionado");
  }

  async function removeLink(id: string) {
    await fetch(`/api/links/${id}`, { method: "DELETE", credentials: "include" });
    updateCreator("links", (creator.links ?? []).filter((link) => link.id !== id));
  }

  async function toggleLinkActive(link: CreatorLink) {
    const nextActive = link.active === false;
    const response = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: nextActive }),
    });
    if (!response.ok) {
      onToast("Erro ao atualizar link");
      return;
    }
    updateCreator("links", (creator.links ?? []).map((item) => (item.id === link.id ? { ...item, active: nextActive } : item)));
  }

  async function persistLinkOrder(next: CreatorLink[]) {
    const response = await fetch("/api/links/reorder", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((link, position) => ({ id: link.id, position })) }),
    });
    if (!response.ok) onToast("Erro ao salvar ordem dos links");
  }

  function reorderLinks(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const links = creator.links ?? [];
    const sourceIndex = links.findIndex((link) => link.id === sourceId);
    const targetIndex = links.findIndex((link) => link.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...links];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateCreator("links", next);
    persistLinkOrder(next).catch(() => onToast("Erro ao salvar ordem dos links"));
    onToast("Ordem dos links atualizada");
  }

  function finishLinkDrag() {
    setDraggedLinkId(null);
    setDragOverLinkId(null);
  }

  function reorderProducts(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const sourceIndex = products.findIndex((product) => product.id === sourceId);
    const targetIndex = products.findIndex((product) => product.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...products];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onProductsChange(next);
    fetch("/api/products/reorder", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((product, position) => ({ id: product.id, position })) }),
    }).catch(() => onToast("Erro ao salvar ordem"));
    onToast("Ordem atualizada");
  }

  async function toggleFeatured(product: Product) {
    const nextFeatured = !product.featured;
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: nextFeatured }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      onToast(payload.error ?? "Erro ao destacar produto");
      return;
    }
    const saved = mapApiProduct(payload.data);
    onProductsChange(products.map((item) => ({ ...item, featured: item.id === saved.id ? saved.featured : false })));
    onToast(nextFeatured ? "Produto destacado" : "Destaque removido");
  }

  async function toggleProductVisibility(product: Product) {
    const nextStatus = (product.status ?? "active") === "active" ? "hidden" : "active";
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      onToast(payload.error ?? "Erro ao atualizar produto");
      return;
    }
    const saved = mapApiProduct(payload.data);
    onProductsChange(products.map((item) => (item.id === saved.id ? saved : item)));
  }

  async function deleteProduct(productId: string) {
    setDeleting(true);
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    if (!response.ok) {
      onToast("Erro ao remover produto");
      return;
    }
    onProductsChange(products.filter((product) => product.id !== productId));
    setDeletingProduct(null);
    onToast("Produto removido");
  }

  function finishProductDrag() {
    setDraggedProductId(null);
    setDragOverProductId(null);
  }

  const announcement = creator.announcement ?? {
    enabled: false,
    text: "",
    background: "rgba(255,77,109,0.10)",
    border: "rgba(255,77,109,0.30)",
  };

  function updateAnnouncement(next: Partial<NonNullable<Creator["announcement"]>>) {
    updateCreator("announcement", { ...announcement, ...next });
  }

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden">
      <Card className="p-5">
        <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Perfil</h2>
        <div className="mt-4 grid gap-4">
          <Input
            label="Nome do criador"
            value={creator.name}
            onChange={(event) => updateCreator("name", event.target.value)}
          />
          <Input
            label="Username"
            value={creator.username}
            onChange={(event) =>
              updateCreator("username", event.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, ""))
            }
          />
          <Textarea
            label="Bio curta"
            maxLength={120}
            hint={`${creator.bio.length}/120`}
            value={creator.bio}
            onChange={(event) => updateCreator("bio", event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Foto de perfil
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)]">
                <span className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold text-[var(--text-primary)] ${creator.avatarImage ? "" : "bg-[var(--bg-elevated)]"}`}>
                  {creator.avatarImage ? (
                    <Image src={creator.avatarImage} alt="" fill sizes="40px" className="object-contain" unoptimized={!canUseOptimizedImage(creator.avatarImage)} />
                  ) : (
                    creator.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex-1">
                  {avatarUploading ? "Enviando imagem..." : creator.avatarImage ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
                </span>
                <ImagePlus size={18} />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={readAvatar} disabled={avatarUploading} />
              </label>
              {avatarUploadError && <p className="text-xs font-semibold text-red-400">{avatarUploadError}</p>}
              <p className="text-xs text-[var(--text-secondary)]">Use JPG, PNG ou WEBP ate 2 MB.</p>
            </div>
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Cor de destaque
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3">
                <input
                  type="color"
                  value={creator.accentColor}
                  onChange={(event) => {
                    const color = event.target.value;
                    onCreatorChange({ ...creator, accentColor: color, avatarColor: color });
                  }}
                  className="size-8 rounded border-0 bg-transparent p-0"
                />
                <span className="text-sm text-[var(--text-secondary)]">{creator.accentColor}</span>
              </div>
            </label>
          </div>
        </div>
      </Card>

      <Card className="border-t border-[var(--border-subtle)] p-5 pt-8">
        <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Mídia</h2>
        <div className="mt-4 grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">Foto de capa</span>
              {creator.coverImage && (
                <button
                  type="button"
                  onClick={() => updateCreator("coverImage", null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)]"
                >
                  <X size={14} />
                  Remover foto
                </button>
              )}
            </div>
            <label className="relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-input)] text-center" style={{ aspectRatio: "16/7" }}>
              {creator.coverImage ? (
                <Image src={creator.coverImage} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-contain" unoptimized={!canUseOptimizedImage(creator.coverImage)} />
              ) : (
                <div className="p-4 text-[var(--text-secondary)]">
                  <ImagePlus className="mx-auto" size={26} />
                  <p className="mt-2 text-sm font-semibold">Adicionar foto de capa (opcional)</p>
                  <p className="mt-1 text-xs">1600x700px recomendado</p>
                </div>
              )}
              {coverUploading && <p className="pb-3 text-sm font-bold text-[#FF4D6D]">Enviando imagem...</p>}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={readCover} disabled={coverUploading} />
            </label>
            {coverUploadError && <p className="text-xs font-semibold text-red-400">{coverUploadError}</p>}
            <p className="text-xs text-[var(--text-secondary)]">Use JPG, PNG ou WEBP ate 8 MB.</p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <label className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--text-primary)]">
              <span className="inline-flex items-center gap-2">
                <Video size={17} />
                Adicionar vídeo à minha loja
              </span>
              <input
                type="checkbox"
                className="size-5 accent-[#FF4D6D]"
                checked={videoEnabled}
                onChange={(event) =>
                  updateCreator(
                    "presentationVideo",
                    event.target.checked
                      ? { url: "", showThumbnail: true, caption: "Assista antes de comprar 👇" }
                      : null,
                  )
                }
              />
            </label>

            {videoEnabled && (
              <div className="grid gap-4">
                <Input
                  label="URL do vídeo"
                  value={videoUrl}
                  onChange={(event) =>
                    updateCreator("presentationVideo", {
                      ...(creator.presentationVideo ?? { showThumbnail: true }),
                      url: event.target.value,
                    })
                  }
                  placeholder="Cole o link do YouTube ou vídeo .mp4"
                  error={videoInvalid ? "URL inválida. Use um link do YouTube ou .mp4" : ""}
                />
                <Input
                  label="Titulo da seção do video"
                  value={creator.presentationVideo?.title ?? ""}
                  onChange={(event) =>
                    updateCreator("presentationVideo", {
                      ...(creator.presentationVideo ?? { url: "", showThumbnail: true }),
                      title: event.target.value,
                    })
                  }
                  placeholder="Veja em ação"
                />
                <Textarea
                  label="Descricao da seção do video"
                  maxLength={180}
                  hint={`${creator.presentationVideo?.description?.length ?? 0}/180`}
                  value={creator.presentationVideo?.description ?? ""}
                  onChange={(event) =>
                    updateCreator("presentationVideo", {
                      ...(creator.presentationVideo ?? { url: "", showThumbnail: true }),
                      description: event.target.value,
                    })
                  }
                  placeholder="Assista ao video de apresentação antes de escolher seu produto."
                />
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--text-primary)]">
                  Mostrar thumbnail antes de carregar
                  <input
                    type="checkbox"
                    className="size-5 accent-[#FF4D6D]"
                    checked={creator.presentationVideo?.showThumbnail ?? true}
                    onChange={(event) =>
                      updateCreator("presentationVideo", {
                        ...(creator.presentationVideo ?? { url: "" }),
                        showThumbnail: event.target.checked,
                      })
                    }
                  />
                </label>
                <Input
                  label="Texto abaixo do vídeo"
                  value={creator.presentationVideo?.caption ?? ""}
                  onChange={(event) =>
                    updateCreator("presentationVideo", {
                      ...(creator.presentationVideo ?? { url: "", showThumbnail: true }),
                      caption: event.target.value,
                    })
                  }
                  placeholder="Assista antes de comprar 👇"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
      <Card className="border-t border-[var(--border-subtle)] p-5 pt-8">
        <div>
          <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Aparência</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Personalize o visual da sua loja</p>
        </div>
        <div className="mt-5">
          <ThemeEditor
            creator={creator}
            products={products}
            theme={theme}
            onThemeChange={onThemeChange}
            onCreatorChange={onCreatorChange}
            onToast={onToast}
          />
        </div>
      </Card>
      <Card className="border-t border-[var(--border-subtle)] p-5 pt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Links</h2>
          <Button
            variant="secondary"
            disabled={(creator.links?.length ?? 0) >= 12}
            onClick={() => {
              setLinkPickerOpen(true);
              setSelectedLinkType(null);
            }}
          >
            <Plus size={16} />
            Adicionar link
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {(creator.links ?? []).map((link) => {
            const Icon = LINK_TYPES[link.type].Icon;
            return (
              <div
                key={link.id}
                draggable
                onDragStart={(event) => {
                  setDraggedLinkId(link.id);
                  event.dataTransfer.setData("text/plain", link.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedLinkId && draggedLinkId !== link.id) setDragOverLinkId(link.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData("text/plain") || draggedLinkId;
                  if (sourceId) reorderLinks(sourceId, link.id);
                  finishLinkDrag();
                }}
                onDragEnd={finishLinkDrag}
                className={`grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 transition sm:flex sm:items-center ${link.active === false ? "opacity-55" : ""} ${dragOverLinkId === link.id ? "border-t-2 border-t-[#FF4D6D]" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GripVertical size={16} className="shrink-0 cursor-grab text-[var(--text-tertiary)]" />
                  <Icon size={18} className="shrink-0 text-[var(--text-secondary)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">{link.label}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">{link.active === false ? "Oculto - " : ""}{link.url}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleLinkActive(link)}
                    className="grid h-10 min-w-0 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80 sm:size-9"
                    aria-label={link.active === false ? "Ativar link" : "Ocultar link"}
                  >
                    {link.active === false ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => editLink(link)}
                    className="grid h-10 min-w-0 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80 sm:size-9"
                    aria-label="Editar link"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="grid h-10 min-w-0 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80 sm:size-9"
                    aria-label="Remover link"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {linkPickerOpen && (
          <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            {!selectedLinkType ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LINK_TYPE_IDS.map((type) => {
                  const Icon = LINK_TYPES[type].Icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => startLink(type)}
                      className="grid gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-center text-xs font-bold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[#FF4D6D]/50"
                    >
                      <Icon className="mx-auto" size={19} />
                      {LINK_TYPES[type].label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-4">
                <Input
                  label="Label"
                  value={linkLabel}
                  onChange={(event) => setLinkLabel(event.target.value)}
                />
                <Input
                  label="URL/contato"
                  value={linkValue}
                  onChange={(event) => {
                    const value = selectedLinkType === "whatsapp" ? event.target.value.replace(/\D/g, "") : event.target.value;
                    setLinkValue(value);
                    setLinkError("");
                  }}
                  placeholder={LINK_TYPES[selectedLinkType].placeholder}
                  error={linkError}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => editingLinkId ? resetLinkForm() : setSelectedLinkType(null)}>
                    Voltar
                  </Button>
                  <Button onClick={saveLink}>{editingLinkId ? "Salvar link" : "Adicionar"}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="border-t border-[var(--border-subtle)] p-5 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Produtos da loja</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Monte a vitrine, ordene os produtos e escolha o destaque.</p>
          </div>
          <Button variant="secondary" onClick={startCreateProduct}>
            <Plus size={16} />
            Novo produto
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="mt-4 grid min-h-44 place-items-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 text-center">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FF4D6D]/10 text-[#FF4D6D]">
                <Package size={24} />
              </div>
              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">Sua vitrine ainda esta vazia</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Crie o primeiro produto sem sair do editor da loja.</p>
              <Button className="mt-4" onClick={startCreateProduct}>Criar produto</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {products.map((product) => {
              const typeMeta = PRODUCT_TYPES[product.type];
              const TypeIcon = typeMeta.Icon;
              const status = product.status ?? (product.active ? "active" : "hidden");
              return (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(event) => {
                    setDraggedProductId(product.id);
                    event.dataTransfer.setData("text/plain", product.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedProductId && draggedProductId !== product.id) setDragOverProductId(product.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = event.dataTransfer.getData("text/plain") || draggedProductId;
                    if (sourceId) reorderProducts(sourceId, product.id);
                    finishProductDrag();
                  }}
                  onDragEnd={finishProductDrag}
                  className={`grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 transition sm:grid-cols-[auto_1fr_auto] sm:items-center ${draggedProductId === product.id ? "scale-[0.98] opacity-40" : ""} ${dragOverProductId === product.id ? "border-t-2 border-t-[#FF4D6D]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="cursor-grab text-[var(--text-tertiary)]" />
                    <div
                      className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--bg-surface)] text-white"
                      style={{ background: product.coverImage ? "var(--bg-surface)" : `linear-gradient(135deg, ${product.coverGradient?.[0] ?? typeMeta.gradient[0]}, ${product.coverGradient?.[1] ?? typeMeta.gradient[1]})` }}
                    >
                      {product.coverImage ? <Image src={product.coverImage} alt="" fill sizes="56px" className="object-contain p-1" unoptimized={!canUseOptimizedImage(product.coverImage)} /> : <TypeIcon size={20} />}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">{product.name}</p>
                      {product.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2 py-1 text-[11px] font-bold text-[#F59E0B]">
                          <Star size={12} fill="currentColor" />
                          Destaque
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${status === "active" ? "bg-[#22C55E]/15 text-[#22C55E]" : status === "draft" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"}`}>
                        {status === "active" ? "Publicado" : status === "draft" ? "Rascunho" : "Oculto"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                      {typeMeta.label} - {formatPrice(product.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(product)}
                      className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80"
                      aria-label={product.featured ? "Remover destaque" : "Destacar produto"}
                    >
                      <Star size={16} fill={product.featured ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductVisibility(product)}
                      className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80"
                      aria-label={status === "active" ? "Ocultar produto" : "Publicar produto"}
                    >
                      {status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditProduct(product)}
                      className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80"
                      aria-label="Editar produto"
                    >
                      <Pencil size={16} />
                    </button>
                    <LinkButton href={`/${creator.username}/${product.id}`} />
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80"
                      aria-label="Remover produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>


      <Button className="w-full" onClick={copyBioLink}>
        <Copy size={17} />
        Copiar link da bio
      </Button>

      <Modal
        open={modalOpen}
        title={editingProduct ? "Editar produto" : "Novo produto"}
        onClose={() => setModalOpen(false)}
      >
        <div className="p-5">
          <ProductForm
            initialProduct={editingProduct ?? undefined}
            products={products}
            onCancel={() => setModalOpen(false)}
            onSave={upsertProduct}
          />
        </div>
      </Modal>
      <DeleteProductDialog
        open={!!deletingProduct}
        productName={deletingProduct?.name ?? ""}
        loading={deleting}
        onConfirm={() => deletingProduct && deleteProduct(deletingProduct.id)}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}

function LinkButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid size-9 place-items-center rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:opacity-80"
      aria-label="Abrir produto"
    >
      <ExternalLink size={16} />
    </a>
  );
}





