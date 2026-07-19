import { z } from "zod";
import { BlogImportError } from "./errors";

const SlugSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const SourceSchema = z.object({
  generatorPostId: z.string().trim().max(160).optional().nullable(),
  batchId: z.string().trim().max(160).optional().nullable(),
}).strict().optional();

export const BlogImportTestSchema = z.object({
  action: z.literal("test"),
}).strict();

export const BlogImportUpsertSchema = z.object({
  action: z.literal("upsert"),
  post: z.object({
    externalId: z.string().trim().min(1).max(180),
    title: z.string().trim().min(1).max(200),
    slug: SlugSchema,
    excerpt: z.string().trim().max(500).optional().nullable(),
    category: z.string().trim().max(120).optional().nullable(),
    htmlContent: z.string().trim().min(1).max(250000),
    coverUrl: z.string().trim().url().max(1000).optional().nullable(),
    coverAlt: z.string().trim().max(200).optional().nullable(),
    metaTitle: z.string().trim().max(200).optional().nullable(),
    metaDescription: z.string().trim().max(500).optional().nullable(),
    primaryKeyword: z.string().trim().max(120).optional().nullable(),
    secondaryKeywords: z.array(z.string().trim().max(120)).max(30).optional().default([]),
    status: z.string().optional().nullable(),
    publishedAt: z.string().datetime().optional().nullable(),
    source: SourceSchema,
  }).strict(),
}).strict();

export const BlogImportPayloadSchema = z.discriminatedUnion("action", [
  BlogImportTestSchema,
  BlogImportUpsertSchema,
]);

export type BlogImportPayload = z.infer<typeof BlogImportPayloadSchema>;
export type BlogImportPostPayload = z.infer<typeof BlogImportUpsertSchema>["post"];

export function parseBlogImportPayload(value: unknown): BlogImportPayload {
  const parsed = BlogImportPayloadSchema.safeParse(value);
  if (!parsed.success) {
    const invalidSlug = parsed.error.issues.some((issue) => issue.path.join(".") === "post.slug");
    if (invalidSlug) throw new BlogImportError("INVALID_SLUG", 422, "Slug invalido.");
    throw new BlogImportError("INVALID_PAYLOAD", 422, "Payload invalido.");
  }
  return parsed.data;
}
