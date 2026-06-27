import { createSupabaseService } from "@/lib/api/supabase-service";
import { sanitizeHtml } from "@/lib/api/sanitize";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { logAdminAction } from "@/lib/admin/audit";
import { requireAdminUser } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/session";
import { z } from "zod";
import { notFound } from "next/navigation";

const BlogPostSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200),
  slug: z.string().trim().min(1, "Slug obrigatorio").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve ser kebab-case"),
  excerpt: z.string().trim().max(500).optional().default(""),
  coverImageUrl: z.string().trim().max(500).optional().default(""),
  contentHtml: z.string().trim().min(1, "Conteudo obrigatorio"),
  metadata: z.string().trim().optional().default("{}"),
  status: z.enum(["draft", "published"]),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) notFound();
    const adminSession = await getAdminSession();
    if (!adminSession) throw new ApiError(401, "Sessao admin necessaria");

    const { id } = await params;

    const parsed = BlogPostSchema.safeParse(await request.json());
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".");
      throw new ApiError(400, field ? `Post invalido: ${field}` : "Post invalido");
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = JSON.parse(parsed.data.metadata);
    } catch {
      throw new ApiError(400, "Metadata deve ser JSON valido");
    }

    const cleanHtml = sanitizeHtml(parsed.data.contentHtml);

    const supabase = createSupabaseService();

    const { data: existing } = await supabase.from("blog_posts").select("id, slug, published_at").eq("slug", parsed.data.slug).maybeSingle();
    if (existing && existing.id !== id) throw new ApiError(409, "Ja existe outro post com este slug");

    const now = new Date().toISOString();
    const wasDraft = !existing?.published_at;
    const publishedAt = parsed.data.status === "published" && wasDraft ? now : existing?.published_at;

    const { data: post, error } = await supabase.from("blog_posts").update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      content_html: cleanHtml,
      metadata,
      status: parsed.data.status,
      published_at: publishedAt,
      updated_at: now,
    }).eq("id", id).select().single();

    if (error) throw new ApiError(500, "Erro ao atualizar post");

    await logAdminAction({
      action: "editou_post_blog",
      targetTable: "blog_posts",
      targetId: id,
      adminEmail: adminUser.email,
      metadata: { slug: post.slug, title: post.title },
    });

    return ok(post);
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) notFound();
    const adminSession = await getAdminSession();
    if (!adminSession) throw new ApiError(401, "Sessao admin necessaria");

    const { id } = await params;

    const supabase = createSupabaseService();

    const { data: post } = await supabase.from("blog_posts").select("id, slug, title").eq("id", id).single();
    if (!post) throw new ApiError(404, "Post nao encontrado");

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) throw new ApiError(500, "Erro ao excluir post");

    await logAdminAction({
      action: "excluiu_post_blog",
      targetTable: "blog_posts",
      targetId: id,
      adminEmail: adminUser.email,
      metadata: { slug: post.slug, title: post.title },
    });

    return ok({ deleted: true });
  } catch (e) {
    return err(e);
  }
}
