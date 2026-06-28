import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { requireAdminUser } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/session";
import { createSupabaseService } from "@/lib/api/supabase-service";
import Badge from "@/components/ui/Badge";
import DeletePostButton from "./_components/DeletePostButton";

export const metadata: Metadata = {
  title: "Blog — Admin Pikbio",
};

export default async function AdminBlogPage() {
  const adminUser = await requireAdminUser();
  if (!adminUser) notFound();
  const adminSession = await getAdminSession();
  if (!adminSession) notFound();

  const supabase = createSupabaseService();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <header className="grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="mt-1 text-sm text-gray-500">{posts?.length ?? 0} posts</p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF4D6D] px-5 text-sm font-semibold text-white transition hover:bg-[#FF2D55]"
        >
          <Plus size={18} />
          Novo post
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">
              <th className="px-5 py-4">Titulo</th>
              <th className="px-5 py-4">Slug</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Criado em</th>
              <th className="px-5 py-4">Publicado em</th>
              <th className="px-5 py-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {posts?.length ? (
              posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 text-sm text-gray-700 last:border-0">
                  <td className="max-w-xs truncate px-5 py-4 font-medium">
                    {post.title}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{post.slug}</td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={post.status === "published" ? "success" : "warning"}
                    >
                      {post.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil size={16} />
                      </Link>
                      <DeletePostButton postId={post.id} postTitle={post.title} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  Nenhum post ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="grid gap-3 p-3 md:hidden">
          {posts?.length ? (
            posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold text-gray-900">{post.title}</h2>
                    <p className="mt-1 break-all font-mono text-xs text-gray-500">{post.slug}</p>
                  </div>
                  <Badge tone={post.status === "published" ? "success" : "warning"}>
                    {post.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-gray-500">
                  <span>Criado em {new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                  <span>
                    Publicado em{" "}
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("pt-BR")
                      : "â€”"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  {post.status === "published" && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-700"
                      aria-label="Abrir post"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  )}
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-700"
                    aria-label="Editar post"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeletePostButton postId={post.id} postTitle={post.title} />
                </div>
              </article>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Nenhum post ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
