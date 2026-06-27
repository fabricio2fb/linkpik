import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Post = {
  slug: string;
  title: string;
  metadata: Record<string, unknown> | null;
};

export default function BlogRelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#111] p-5">
      <h3 className="font-heading text-sm font-black uppercase tracking-[0.08em] text-white/48">Outras materias</h3>
      <div className="mt-4 grid gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block border-b border-white/[0.06] pb-4 last:border-0 last:pb-0"
          >
            {post.metadata && typeof post.metadata.categoria === "string" && (
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF4D6D]">
                {post.metadata.categoria}
              </span>
            )}
            <p className="mt-1 text-sm font-bold text-white transition group-hover:text-[#FF4D6D]">
              {post.title}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-white/34 transition group-hover:text-white/60">
              Ler materia <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
