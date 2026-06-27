import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/session";
import { createSupabaseService } from "@/lib/api/supabase-service";
import BlogForm from "../_components/BlogForm";

export const metadata: Metadata = {
  title: "Editar post — Admin Pikbio",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const adminUser = await requireAdminUser();
  if (!adminUser) notFound();
  const adminSession = await getAdminSession();
  if (!adminSession) notFound();

  const { id } = await params;
  const supabase = createSupabaseService();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <BlogForm
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        cover_image_url: post.cover_image_url ?? "",
        content_html: post.content_html,
        metadata: JSON.stringify(post.metadata, null, 2),
        status: post.status,
      }}
    />
  );
}
