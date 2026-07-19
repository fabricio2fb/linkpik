import { createSupabaseService } from "@/lib/api/supabase-service";
import { getSiteUrl } from "@/lib/site-config";
import { BlogImportError } from "./errors";
import type { BlogImportPostPayload } from "./schema";

type BlogPostRow = {
  id: string;
  external_id?: string | null;
  slug: string;
  title: string;
  status: string;
  metadata?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isGeneratorPost(row: BlogPostRow | null | undefined) {
  return Boolean(row?.external_id) || asRecord(row?.metadata).source === "generator";
}

function isAfter(left?: unknown, right?: unknown) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime > rightTime;
}

export async function saveImportedPost(params: {
  post: BlogImportPostPayload;
  cleanHtml: string;
}) {
  const supabase = createSupabaseService();
  const now = new Date().toISOString();
  const externalId = params.post.externalId.trim();

  const { data: existingByExternalId, error: externalError } = await supabase
    .from("blog_posts")
    .select("id, external_id, slug, title, status, metadata")
    .eq("external_id", externalId)
    .maybeSingle();

  if (externalError) {
    console.error("[BlogImport] external lookup failed", externalError);
    throw new BlogImportError("DATABASE_ERROR", 500, "Erro ao consultar post.");
  }

  const { data: existingBySlug, error: slugError } = await supabase
    .from("blog_posts")
    .select("id, external_id, slug, title, status, metadata")
    .eq("slug", params.post.slug)
    .maybeSingle();

  if (slugError) {
    console.error("[BlogImport] slug lookup failed", slugError);
    throw new BlogImportError("DATABASE_ERROR", 500, "Erro ao consultar slug.");
  }

  if (existingBySlug && existingBySlug.id !== existingByExternalId?.id) {
    throw new BlogImportError("SLUG_CONFLICT", 409, "Slug ja utilizado por outro post.");
  }

  if (existingByExternalId && !isGeneratorPost(existingByExternalId)) {
    throw new BlogImportError("SLUG_CONFLICT", 409, "Post existente nao e automatico.");
  }

  const currentMetadata = asRecord(existingByExternalId?.metadata);
  if (
    existingByExternalId &&
    isAfter(currentMetadata.lastManualEditAt, currentMetadata.importedAt)
  ) {
    const nextMetadata = {
      ...currentMetadata,
      importConflict: true,
      lastImportError: "MANUAL_EDIT_CONFLICT",
    };
    await supabase.from("blog_posts").update({ metadata: nextMetadata, updated_at: now }).eq("id", existingByExternalId.id);
    throw new BlogImportError("MANUAL_EDIT_CONFLICT", 409, "Este artigo foi editado manualmente apos a ultima importacao.");
  }

  const metadata = {
    ...currentMetadata,
    source: "generator",
    category: params.post.category ?? currentMetadata.category ?? null,
    coverAlt: params.post.coverAlt ?? params.post.title,
    metaTitle: params.post.metaTitle ?? params.post.title,
    metaDescription: params.post.metaDescription ?? params.post.excerpt ?? "",
    primaryKeyword: params.post.primaryKeyword ?? null,
    secondaryKeywords: params.post.secondaryKeywords ?? [],
    generatorPostId: params.post.source?.generatorPostId ?? null,
    generatorBatchId: params.post.source?.batchId ?? null,
    importedAt: now,
    lastImportError: null,
    importConflict: false,
  };

  const postData = {
    external_id: externalId,
    title: params.post.title,
    slug: params.post.slug,
    excerpt: params.post.excerpt ?? "",
    content_html: params.cleanHtml,
    cover_image_url: params.post.coverUrl ?? null,
    status: "draft",
    published_at: null,
    updated_at: now,
    metadata,
  };

  const action = existingByExternalId ? "updated" : "created";
  const mutation = existingByExternalId
    ? supabase.from("blog_posts").update(postData).eq("id", existingByExternalId.id).select("id, external_id, title, slug, status").single()
    : supabase.from("blog_posts").insert({ ...postData, created_at: now }).select("id, external_id, title, slug, status").single();

  const { data, error } = await mutation;
  if (error || !data) {
    console.error("[BlogImport] save failed", error);
    throw new BlogImportError("DATABASE_ERROR", 500, "Erro ao salvar post.");
  }

  return {
    action,
    post: {
      externalId: data.external_id,
      remoteId: data.id,
      title: data.title,
      slug: data.slug,
      status: data.status,
      url: `${getSiteUrl()}/blog/${data.slug}`,
    },
  };
}
