"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import Toast from "@/components/ui/Toast";

type PostData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  content_html: string;
  metadata: string;
  status: string;
};

type Props = {
  initialData?: PostData;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const DEFAULT_METADATA = JSON.stringify({ autor: "Pikbio" }, null, 2);

function extractCoverDimensions(metadata?: string): { width: number; height: number } | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata);
    if (typeof parsed.coverWidth === "number" && typeof parsed.coverHeight === "number") {
      return { width: parsed.coverWidth, height: parsed.coverHeight };
    }
  } catch { /* ignore */ }
  return null;
}

export default function BlogForm({ initialData }: Props) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url ?? "");
  const [contentHtml, setContentHtml] = useState(initialData?.content_html ?? "");
  const [metadataStr, setMetadataStr] = useState(initialData?.metadata ?? DEFAULT_METADATA);
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [coverDimensions, setCoverDimensions] = useState<{ width: number; height: number } | null>(
    extractCoverDimensions(initialData?.metadata)
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  function validateMetadata(value: string): boolean {
    try {
      JSON.parse(value);
      setMetadataError(null);
      return true;
    } catch {
      setMetadataError("JSON invalido");
      return false;
    }
  }

  function handleMetadataChange(value: string) {
    setMetadataStr(value);
    validateMetadata(value);
  }

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setToast("Imagem muito grande. Maximo 5MB.");
      return;
    }
    setUploading(true);
    try {
      const signRes = await fetch("/api/uploads/cloudinary/sign-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          uploadType: "blog_cover",
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.data.apiKey);
      formData.append("timestamp", String(signData.data.timestamp));
      formData.append("signature", signData.data.signature);
      formData.append("folder", signData.data.folder);
      formData.append("public_id", signData.data.publicId);
      formData.append("type", "upload");
      formData.append("overwrite", "false");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.data.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Upload falhou");

      setCoverImageUrl(uploadData.secure_url);
      setCoverDimensions({ width: uploadData.width, height: uploadData.height });
      setToast("Imagem enviada");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateMetadata(metadataStr)) return;

    setLoading(true);

    let mergedMetadata: Record<string, unknown>;
    try {
      mergedMetadata = JSON.parse(metadataStr);
    } catch {
      setMetadataError("JSON invalido");
      setLoading(false);
      return;
    }
    if (coverDimensions) {
      mergedMetadata.coverWidth = coverDimensions.width;
      mergedMetadata.coverHeight = coverDimensions.height;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/admin/blog/${initialData.id}` : "/api/admin/blog";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          coverImageUrl,
          contentHtml,
          metadata: JSON.stringify(mergedMetadata),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToast(isEditing ? "Post atualizado" : "Post criado");
      setTimeout(() => router.push("/admin/blog"), 1000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar post" : "Novo post"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-gray-400">Conteudo</h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Titulo *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="input-base h-11 w-full px-3"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug *</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="input-base h-11 w-full px-3 font-mono text-sm"
                      required
                      pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    />
                    <p className="mt-1 text-xs text-gray-400">Formato kebab-case. Editado manualmente nao e atualizado automaticamente.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Resumo (excerpt)</label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="input-base w-full resize-none px-3 py-2.5"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Imagem de capa</label>
                    <div className="flex items-start gap-3">
                      <input
                        type="text"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="URL da imagem"
                        className="input-base h-11 flex-1 px-3"
                      />
                      <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 text-gray-400 transition hover:border-[#FF4D6D] hover:text-[#FF4D6D]">
                        <Upload size={18} />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    {coverImageUrl && (
                      <div>
                        <img src={coverImageUrl} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />
                        {coverDimensions && (
                          <p className="mt-1.5 text-xs text-gray-400">
                            {coverDimensions.width} x {coverDimensions.height} px
                          </p>
                        )}
                      </div>
                    )}
                    {uploading && <p className="mt-1 text-xs text-gray-400">Enviando...</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-gray-400">Metadados</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">JSON</label>
                  <textarea
                    value={metadataStr}
                    onChange={(e) => handleMetadataChange(e.target.value)}
                    className={`input-base w-full resize-none px-3 py-2.5 font-mono text-xs ${metadataError ? "border-red-400" : ""}`}
                    rows={6}
                  />
                  {metadataError && (
                    <p className="mt-1 text-xs text-red-500">{metadataError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Campos opcionais: autor, tags (array de strings), etc.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-gray-400">Conteudo HTML</h2>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className="text-xs font-semibold text-[#FF4D6D] transition hover:text-[#FF2D55]"
                  >
                    {preview ? "Editar" : "Visualizar"}
                  </button>
                </div>

                {preview ? (
                  <div
                    className="prose max-w-none rounded-xl border border-gray-100 bg-white p-4 prose-headings:font-heading prose-headings:font-black prose-a:text-[#FF4D6D] prose-a:underline prose-a:underline-offset-2 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                ) : (
                  <textarea
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    className="input-base w-full resize-none px-3 py-2.5 font-mono text-xs leading-relaxed"
                    rows={20}
                    required
                    placeholder="<h2>Introducao</h2><p>Seu texto aqui...</p>"
                  />
                )}
                {!preview && (
                  <p className="mt-2 text-xs text-gray-400">
                    Dica: inclua &lt;div class=&quot;blog-cta&quot;&gt; no meio do texto para um CTA contextual.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-gray-400">Publicacao</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-base h-11 w-full px-3"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {status === "published"
                      ? "O post fica visivel publicamente."
                      : "Apenas visivel no admin."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href="/admin/blog"
                  className="inline-flex h-11 items-center rounded-[10px] border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading || !!metadataError}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#FF4D6D] px-6 text-sm font-semibold text-white transition hover:bg-[#FF2D55] disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Toast message={toast} />
    </>
  );
}
