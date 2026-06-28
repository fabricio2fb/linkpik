import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import BlogCTACard from "@/components/blog/BlogCTACard";
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { sanitizeHtml } from "@/lib/api/sanitize";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

async function getRelatedPosts(currentSlug: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, metadata")
    .eq("status", "published")
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Blog Pikbio`,
    description: post.excerpt ?? undefined,
    openGraph: post.cover_image_url
      ? { images: [{ url: post.cover_image_url }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(slug);
  const cleanHtml = sanitizeHtml(post.content_html);

  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <article className="px-5 pt-40 pb-24">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/34 transition hover:text-[#FF4D6D]"
          >
            <ArrowLeft size={14} />
            Voltar para o blog
          </Link>

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="mb-8 w-full rounded-[28px] object-cover"
            />
          )}

          {post.metadata && typeof post.metadata.categoria === "string" && (
            <span className="inline-block rounded-full bg-[#FF4D6D]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#FF4D6D]">
              {post.metadata.categoria}
            </span>
          )}

          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/34">
            {post.published_at && (
              <span className="mt-3 flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(post.published_at).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
            {post.title}
          </h1>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
            <div
              className="blog-content max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />

            <aside className="space-y-6">
              <div className="lg:sticky lg:top-24 lg:space-y-6">
                <BlogCTACard />
                <BlogRelatedPosts posts={relatedPosts} />
              </div>
            </aside>
          </div>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}
