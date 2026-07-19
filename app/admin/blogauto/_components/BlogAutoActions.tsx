"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ExternalLink, Pencil, Trash2, UploadCloud, XCircle } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";

type BlogAutoPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  content_html: string;
  metadata?: Record<string, unknown> | null;
  status: "draft" | "published";
};

function metadataString(metadata?: Record<string, unknown> | null) {
  return JSON.stringify(metadata ?? {}, null, 2);
}

export default function BlogAutoActions({ post }: { post: BlogAutoPost }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function updateStatus(status: "draft" | "published") {
    setLoading(status);
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          coverImageUrl: post.cover_image_url ?? "",
          contentHtml: post.content_html,
          metadata: metadataString(post.metadata),
          status,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Erro ao atualizar post");
      setToast(status === "published" ? "Post publicado" : "Post despublicado");
      router.refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Erro ao atualizar post");
    } finally {
      setLoading(null);
    }
  }

  async function deletePost() {
    if (confirmText !== "EXCLUIR") return;
    setLoading("delete");
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Erro ao excluir post");
      setToast("Post excluido");
      setDeleteOpen(false);
      setConfirmText("");
      router.refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Erro ao excluir post");
    } finally {
      setLoading(null);
    }
  }

  const canDelete = confirmText === "EXCLUIR";

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/admin/blog/${post.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Visualizar no editor"
          aria-label="Visualizar no editor"
        >
          <Eye size={16} />
        </Link>
        <Link
          href={`/admin/blog/${post.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Editar"
          aria-label="Editar"
        >
          <Pencil size={16} />
        </Link>
        {post.status === "published" ? (
          <>
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              title="Abrir no site"
              aria-label="Abrir no site"
            >
              <ExternalLink size={16} />
            </Link>
            <button
              type="button"
              onClick={() => updateStatus("draft")}
              disabled={loading === "draft"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
              title="Despublicar"
              aria-label="Despublicar"
            >
              <XCircle size={16} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => updateStatus("published")}
            disabled={loading === "published"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
            title="Publicar"
            aria-label="Publicar"
          >
            <UploadCloud size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          title="Excluir"
          aria-label="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Modal open={deleteOpen} title="Excluir post automatico" onClose={() => { setDeleteOpen(false); setConfirmText(""); }} maxWidth="max-w-md">
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Esta acao e permanente.</p>
            <p className="mt-1">O post &ldquo;{post.title}&rdquo; sera excluido.</p>
          </div>
          <p className="text-sm font-medium text-gray-700">Digite <span className="font-bold">EXCLUIR</span> para confirmar:</p>
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="EXCLUIR"
            className="input-base h-11 px-3"
            autoComplete="off"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setDeleteOpen(false); setConfirmText(""); }}
              className="inline-flex h-11 items-center rounded-[10px] border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={deletePost}
              disabled={!canDelete || loading === "delete"}
              className="inline-flex h-11 items-center rounded-[10px] bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading === "delete" ? "Excluindo..." : "Excluir post"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}
