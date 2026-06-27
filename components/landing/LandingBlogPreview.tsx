"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};

const gradients = [
  ["#FF4D6D", "#7C3AED"],
  ["#10B981", "#064E3B"],
  ["#06B6D4", "#1E3A8A"],
];

export default function LandingBlogPreview() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/blog/latest")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setPosts(d.data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <section className="bg-[#0A0A0A] px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Blog</p>
            <h2 className="mt-4 font-heading text-4xl font-black tracking-[-0.06em]">Ultimas postagens</h2>
            <p className="mt-5 text-base leading-7 text-white/50">Dicas e novidades para criar e vender melhor.</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Ver blog
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, idx) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[28px] border border-white/[0.07] bg-[#111] p-6 transition hover:-translate-y-1 hover:border-[#FF4D6D]/28"
            >
              {post.cover_image_url ? (
                <div
                  className="flex h-40 items-end rounded-2xl bg-cover bg-center p-4"
                  style={{ backgroundImage: `url(${post.cover_image_url})` }}
                />
              ) : (
                <div
                  className="flex h-40 items-end rounded-2xl p-4"
                  style={{ background: `linear-gradient(135deg, ${gradients[idx][0]}, ${gradients[idx][1]})` }}
                />
              )}
              {post.metadata && typeof post.metadata.categoria === "string" && (
                <span className="mt-4 inline-block rounded-full bg-[#FF4D6D]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#FF4D6D]">
                  {post.metadata.categoria}
                </span>
              )}
              <h3 className="mt-3 font-heading text-lg font-black tracking-[-0.03em] text-white transition group-hover:text-[#FF4D6D]">
                {post.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/50 line-clamp-2">{post.excerpt}</p>
              <div className="mt-5 flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/34">
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(post.published_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
