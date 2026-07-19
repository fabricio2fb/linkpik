import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, CalendarDays, ExternalLink, FileWarning, Search, UploadCloud } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import { requireAdminUser } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/session";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { getSiteUrl } from "@/lib/site-config";
import BlogAutoActions from "./_components/BlogAutoActions";
import CopyEndpointButton from "./_components/CopyEndpointButton";

export const metadata: Metadata = {
  title: "Blog Auto - Admin Pikbio",
};

type SearchParams = {
  q?: string;
  status?: string;
  date?: string;
  recent?: string;
  conflicts?: string;
  errors?: string;
};

type BlogAutoPost = {
  id: string;
  external_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content_html: string;
  cover_image_url?: string | null;
  status: "draft" | "published";
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function dateFilterStart(value?: string) {
  const now = Date.now();
  if (value === "7d") return new Date(now - 7 * 86400000).toISOString();
  if (value === "30d") return new Date(now - 30 * 86400000).toISOString();
  if (value === "90d") return new Date(now - 90 * 86400000).toISOString();
  return null;
}

function matchesFilters(post: BlogAutoPost, filters: SearchParams) {
  const metadata = asRecord(post.metadata);
  const q = filters.q?.trim().toLowerCase();
  if (q && !`${post.title} ${post.slug}`.toLowerCase().includes(q)) return false;
  if ((filters.status === "draft" || filters.status === "published") && post.status !== filters.status) return false;
  const start = dateFilterStart(filters.date);
  if (start && new Date(String(metadata.importedAt ?? post.created_at)) < new Date(start)) return false;
  if (filters.recent === "1" && new Date(String(metadata.importedAt ?? post.created_at)) < new Date(Date.now() - 7 * 86400000)) return false;
  if (filters.conflicts === "1" && metadata.importConflict !== true) return false;
  if (filters.errors === "1" && !metadata.lastImportError) return false;
  return true;
}

function isAutoPost(post: BlogAutoPost) {
  return Boolean(post.external_id) || asRecord(post.metadata).source === "generator";
}

export default async function BlogAutoPage(props: { searchParams: Promise<SearchParams> }) {
  const adminUser = await requireAdminUser();
  if (!adminUser) notFound();
  const adminSession = await getAdminSession();
  if (!adminSession) notFound();

  const filters = await props.searchParams;
  const supabase = createSupabaseService();
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, external_id, title, slug, excerpt, content_html, cover_image_url, status, published_at, created_at, updated_at, metadata")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[BlogAuto] list failed", error);
  }

  const allAutoPosts = ((posts ?? []) as BlogAutoPost[]).filter(isAutoPost);
  const autoPosts = allAutoPosts.filter((post) => matchesFilters(post, filters));
  const drafts = allAutoPosts.filter((post) => post.status === "draft").length;
  const published = allAutoPosts.filter((post) => post.status === "published").length;
  const conflicts = allAutoPosts.filter((post) => asRecord(post.metadata).importConflict === true).length;
  const errors = allAutoPosts.filter((post) => Boolean(asRecord(post.metadata).lastImportError)).length;
  const updated = allAutoPosts.filter((post) => post.updated_at !== post.created_at).length;
  const lastImported = allAutoPosts
    .map((post) => ({ post, importedAt: String(asRecord(post.metadata).importedAt ?? "") }))
    .filter((item) => item.importedAt)
    .sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt))[0];
  const lastError = allAutoPosts
    .map((post) => ({ post, error: asRecord(post.metadata).lastImportError, importedAt: String(asRecord(post.metadata).importedAt ?? post.updated_at) }))
    .filter((item) => item.error)
    .sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt))[0];
  const endpoint = `${getSiteUrl()}/api/blog/import`;
  const tokenConfigured = Boolean(process.env.BLOG_IMPORT_TOKEN);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header className="grid gap-4 sm:flex sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Auto</h1>
          <p className="mt-1 text-sm text-gray-500">Receba, revise e publique artigos enviados pelo Gerador de Blog.</p>
        </div>
        <Link
          href="/admin/blog"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ExternalLink size={16} />
          Blog manual
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Recebidos" value={String(allAutoPosts.length)} delta="artigos automaticos" icon={Bot} color="#FF4D6D" />
        <MetricCard label="Rascunhos" value={String(drafts)} delta="aguardando revisao" icon={UploadCloud} color="#F59E0B" />
        <MetricCard label="Publicados" value={String(published)} delta="visiveis no blog" icon={ExternalLink} color="#22C55E" />
        <MetricCard label="Atualizados" value={String(updated)} delta="reenviados/editados" icon={CalendarDays} color="#38BDF8" />
        <MetricCard label="Com erro" value={String(errors + conflicts)} delta="erros ou conflitos" icon={FileWarning} color="#EF4444" positive={errors + conflicts === 0} />
      </section>

      <Card className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-[#FF4D6D]" />
              <h2 className="text-base font-bold text-gray-900">Integracao</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
              <Info label="Endpoint" value={endpoint} mono />
              <Info label="Metodo" value="POST" />
              <Info label="Autenticacao" value="Bearer Token" />
              <Info label="Token" value={tokenConfigured ? "Configurado" : "Nao configurado"} />
              <Info label="Ultimo teste" value="Nao identificado com seguranca no projeto" />
              <Info label="Ultimo artigo recebido" value={lastImported ? `${lastImported.post.title} - ${formatDate(lastImported.importedAt)}` : "Nenhum"} />
              <Info label="Ultimo erro" value={lastError ? String(lastError.error) : "Nenhum"} />
              <Info label="Artigos automaticos" value={String(allAutoPosts.length)} />
            </div>
          </div>
          <CopyEndpointButton endpoint={endpoint} />
        </div>
      </Card>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[1.5fr_160px_160px_repeat(3,auto)]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Busca</span>
            <div className="relative">
              <input name="q" defaultValue={filters.q ?? ""} placeholder="Titulo ou slug..." className="input-base h-11 px-3 pr-9" />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Status</span>
            <select name="status" defaultValue={filters.status ?? ""} className="input-base h-11 px-3">
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            <span>Data</span>
            <select name="date" defaultValue={filters.date ?? ""} className="input-base h-11 px-3">
              <option value="">Todas</option>
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-gray-700">
            <input type="checkbox" name="recent" value="1" defaultChecked={filters.recent === "1"} className="size-4 accent-[#FF4D6D]" />
            Recentes
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-gray-700">
            <input type="checkbox" name="conflicts" value="1" defaultChecked={filters.conflicts === "1"} className="size-4 accent-[#FF4D6D]" />
            Conflitos
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-gray-700">
            <input type="checkbox" name="errors" value="1" defaultChecked={filters.errors === "1"} className="size-4 accent-[#FF4D6D]" />
            Erros
          </label>
          <div className="grid gap-2 sm:flex sm:items-end lg:col-span-6">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#FF4D6D] px-4 text-sm font-semibold text-white hover:bg-[#FF2D55]">
              Filtrar
            </button>
            <Link href="/admin/blogauto" className="inline-flex h-11 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">
              <th className="px-5 py-4">Titulo</th>
              <th className="px-5 py-4">Slug</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Recebido</th>
              <th className="px-5 py-4">Ultima importacao</th>
              <th className="px-5 py-4">Publicado</th>
              <th className="px-5 py-4">Capa</th>
              <th className="px-5 py-4">Origem</th>
              <th className="px-5 py-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {autoPosts.length ? autoPosts.map((post) => {
              const postMetadata = asRecord(post.metadata);
              const conflict = postMetadata.importConflict === true;
              return (
                <tr key={post.id} className="border-b border-gray-100 text-sm text-gray-700 last:border-0">
                  <td className="max-w-xs px-5 py-4">
                    <p className="truncate font-medium">{post.title}</p>
                    {conflict && <p className="mt-1 text-xs font-semibold text-amber-600">Este artigo foi editado manualmente apos a ultima importacao.</p>}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{post.slug}</td>
                  <td className="px-5 py-4">
                    <Badge tone={post.status === "published" ? "success" : "warning"}>{post.status === "published" ? "Publicado" : "Rascunho"}</Badge>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(post.created_at)}</td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(String(postMetadata.importedAt ?? post.updated_at))}</td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(post.published_at)}</td>
                  <td className="px-5 py-4">
                    {post.cover_image_url ? <img src={post.cover_image_url} alt="" className="h-10 w-16 rounded-lg object-cover" /> : <span className="text-xs text-gray-400">Sem capa</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone="accent">Gerador de Blog</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <BlogAutoActions post={post} />
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">Nenhum artigo automatico encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="grid gap-3 p-3 md:hidden">
          {autoPosts.length ? autoPosts.map((post) => {
            const postMetadata = asRecord(post.metadata);
            return (
              <article key={post.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  {post.cover_image_url ? <img src={post.cover_image_url} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-bold text-gray-900">{post.title}</h2>
                    <p className="mt-1 break-all font-mono text-xs text-gray-500">{post.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="accent">Gerador de Blog</Badge>
                      <Badge tone={post.status === "published" ? "success" : "warning"}>{post.status === "published" ? "Publicado" : "Rascunho"}</Badge>
                    </div>
                  </div>
                </div>
                {postMetadata.importConflict === true && <p className="mt-3 text-xs font-semibold text-amber-600">Este artigo foi editado manualmente apos a ultima importacao.</p>}
                <div className="mt-3 grid gap-1 text-xs text-gray-500">
                  <span>Recebido em {formatDate(post.created_at)}</span>
                  <span>Ultima importacao {formatDate(String(postMetadata.importedAt ?? post.updated_at))}</span>
                  <span>Publicado em {formatDate(post.published_at)}</span>
                </div>
                <div className="mt-4">
                  <BlogAutoActions post={post} />
                </div>
              </article>
            );
          }) : (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Nenhum artigo automatico encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold text-gray-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
