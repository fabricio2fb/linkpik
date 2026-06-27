import type { Metadata } from "next";
import Link from "next/link";
import { Calendar } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blog — Pikbio",
  description: "Dicas, tutoriais e novidades sobre vendas digitais, link na bio e empreendedorismo para criadores.",
};

const gradients = [
  ["#FF4D6D", "#7C3AED"],
  ["#10B981", "#064E3B"],
  ["#06B6D4", "#1E3A8A"],
  ["#F59E0B", "#B45309"],
  ["#7C3AED", "#FF4D6D"],
  ["#FF4D6D", "#FF2D55"],
];

const POSTS_PER_PAGE = 12;

export default async function BlogPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, Number(searchParams.page) || 1);

  const supabase = await createSupabaseServer();
  const from = (currentPage - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  const { data: posts, count } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_image_url, published_at, metadata", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / POSTS_PER_PAGE) : 0;

  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <section className="px-5 pt-40 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Blog</p>
            <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
              Dicas para criar e vender
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
              Tutoriais, estratégias e novidades sobre vendas digitais e link na bio.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts?.length ? (
              posts.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-[28px] border border-white/[0.08] bg-[#0f0f0f]/90 p-6 transition hover:-translate-y-1 hover:border-white/20"
                >
                  {post.cover_image_url ? (
                    <div
                      className="flex h-40 items-end rounded-2xl bg-cover bg-center p-4"
                      style={{ backgroundImage: `url(${post.cover_image_url})` }}
                    />
                  ) : (
                    <div
                      className="flex h-40 items-end rounded-2xl p-4"
                      style={{ background: `linear-gradient(135deg, ${gradients[idx % gradients.length][0]}, ${gradients[idx % gradients.length][1]})` }}
                    />
                  )}
                  <h2 className="mt-5 font-heading text-lg font-black tracking-[-0.03em] text-white transition group-hover:text-[#FF4D6D]">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/52">{post.excerpt}</p>
                  <div className="mt-5 flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/34">
                    {post.metadata && typeof post.metadata === "object" && "autor" in (post.metadata as Record<string, unknown>) && (
                      <span>{(post.metadata as Record<string, string>).autor}</span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
                        : ""}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-white/34">Nenhum post publicado ainda.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-3">
              {currentPage > 1 && (
                <Link
                  href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                  className="inline-flex h-10 items-center rounded-[10px] border border-white/10 px-4 text-sm font-semibold text-white/52 transition hover:border-white/20 hover:text-white"
                >
                  Anterior
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={p === 1 ? "/blog" : `/blog?page=${p}`}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-sm font-semibold transition ${
                    p === currentPage
                      ? "bg-[#FF4D6D] text-white"
                      : "border border-white/10 text-white/52 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="inline-flex h-10 items-center rounded-[10px] border border-white/10 px-4 text-sm font-semibold text-white/52 transition hover:border-white/20 hover:text-white"
                >
                  Próxima
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
