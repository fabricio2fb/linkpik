import { z } from "zod";

export const UploadTypeSchema = z.enum(["product_image", "creator_avatar", "store_banner", "blog_cover"]);
export const ProductKindSchema = z.enum(["digital", "physical"]).optional();

export const CloudinarySignSchema = z.object({
  uploadType: UploadTypeSchema,
  productKind: ProductKindSchema,
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(8 * 1024 * 1024),
}).strict().superRefine((data, ctx) => {
  const extension = data.filename.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
  if (!extension || !allowedExtensions.has(extension)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["filename"], message: "Extensao nao permitida" });
  }

  const maxSizeByType = {
    product_image: 5 * 1024 * 1024,
    creator_avatar: 2 * 1024 * 1024,
    store_banner: 8 * 1024 * 1024,
    blog_cover: 5 * 1024 * 1024,
  } satisfies Record<z.infer<typeof UploadTypeSchema>, number>;

  if (data.size > maxSizeByType[data.uploadType]) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["size"], message: "Imagem muito grande" });
  }
});

export const CloudinaryDeleteSchema = z.object({
  publicId: z.string().trim().min(8).max(300).regex(/^[A-Za-z0-9/_-]+$/),
}).strict();
