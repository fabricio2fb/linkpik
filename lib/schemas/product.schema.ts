import { z } from "zod";
import { ProductPageSectionsSchema } from "@/lib/product-page-sections";

const PRODUCT_TYPES = ["infoproduto", "fisico", "ebook", "planilha", "template", "curso", "mentoria", "pack", "comunidade"] as const;
const PRODUCT_STATUS = ["active", "draft", "hidden"] as const;

const BoundedString = z.string().max(500);
const ShortString = z.string().max(120);
const UrlString = z.string().url().max(500);

const ProductReviewSchema = z.object({
  id: z.string().max(80),
  author: z.string().min(1).max(80),
  avatar: z.string().max(500),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(500),
  date: z.string().max(30),
  verified: z.boolean(),
}).strict();

const ProductModuleSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  lessons: z.number().int().min(0).max(500),
}).strict();

export const ProductDetailsSchema = z.object({
  originalPrice: z.number().min(0).max(99999).optional(),
  shortDescription: ShortString.optional(),
  includes: z.array(z.string().max(160)).max(20).optional(),
  reviews: z.array(ProductReviewSchema).max(20).optional(),
  coverColor: z.string().max(40).optional(),
  coverGradient: z.array(z.string().max(40)).min(2).max(2).optional(),
  level: z.enum(["Iniciante", "Intermediario", "Intermediário", "Avancado", "Avançado"]).optional(),
  deliveryPlatform: ShortString.optional(),
  deliveryUrl: UrlString.optional(),
  pages: z.number().int().min(0).max(100000).optional(),
  language: z.enum(["Portugues", "Português", "Ingles", "Inglês", "Espanhol"]).optional(),
  compatibleWith: z.array(ShortString).max(20).optional(),
  templatePlatform: ShortString.optional(),
  accessLink: UrlString.optional(),
  usageInstructions: z.string().max(2000).optional(),
  lessonCount: z.number().int().min(0).max(10000).optional(),
  duration: ShortString.optional(),
  coursePlatform: ShortString.optional(),
  courseUrl: UrlString.optional(),
  modules: z.array(ProductModuleSchema).max(50).optional(),
  prerequisites: z.string().max(1000).optional(),
  certificate: z.boolean().optional(),
  sessionDuration: ShortString.optional(),
  sessionFormat: ShortString.optional(),
  schedulingMethod: ShortString.optional(),
  schedulingValue: BoundedString.optional(),
  availability: z.string().max(1000).optional(),
  recordingIncluded: z.boolean().optional(),
  seats: z.number().int().min(0).max(100000).optional(),
  fileCount: z.number().int().min(0).max(100000).optional(),
  fileTypes: z.array(ShortString).max(30).optional(),
  totalSize: ShortString.optional(),
  license: ShortString.optional(),
  communityPlatform: ShortString.optional(),
  accessMethod: ShortString.optional(),
  contentFrequency: ShortString.optional(),
  members: z.number().int().min(0).max(10000000).optional(),
  renewal: ShortString.optional(),
  billingType: z.enum(["one_time", "subscription", "free"]).optional(),
  subscriptionPeriod: ShortString.optional(),
  freeTrialDays: z.number().int().min(0).max(365).optional(),
  leadFields: z.array(ShortString).max(10).optional(),
  installments: z.number().int().min(0).max(24).optional(),
  deliveryMessage: z.string().max(2000).optional(),
  thankYouMessage: z.string().max(1000).optional(),
  postPurchaseInstagram: ShortString.optional(),
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]*$/).max(80).optional().nullable(),
  stock: z.number().int().min(0).max(1000000).optional(),
  stockMinimum: z.number().int().min(0).max(1000000).optional(),
  trackInventory: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
  weight: ShortString.optional(),
  height: ShortString.optional(),
  width: ShortString.optional(),
  length: ShortString.optional(),
  originPostalCode: ShortString.optional(),
  preparationTime: ShortString.optional(),
  shippingNotes: z.string().max(1000).optional(),
  upsell: z.object({
    productId: z.string().uuid(),
    price: z.number().min(0).max(99999),
    originalPrice: z.number().min(0).max(99999),
    buttonText: z.string().max(80),
    discount: z.number().int().min(0).max(100),
  }).strict().nullable().optional(),
}).strict();

const ProductPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive().max(99999),
  type: z.enum(PRODUCT_TYPES),
  file_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  image_provider: z.enum(["cloudinary", "supabase", "external"]).optional().nullable(),
  image_public_id: z.string().trim().max(300).regex(/^[A-Za-z0-9/_-]+$/).optional().nullable(),
  image_url: z.string().url().max(1000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  status: z.enum(PRODUCT_STATUS).optional().default("active"),
  is_featured: z.boolean().optional().default(false),
  product_kind: z.enum(["digital", "physical"]).optional(),
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]*$/).max(80).optional().nullable(),
  stock_quantity: z.number().int().min(0).max(1000000).optional(),
  stock_minimum: z.number().int().min(0).max(1000000).optional(),
  track_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  weight_grams: z.number().int().positive().max(1000000).optional().nullable(),
  width_cm: z.number().positive().max(10000).optional().nullable(),
  height_cm: z.number().positive().max(10000).optional().nullable(),
  length_cm: z.number().positive().max(10000).optional().nullable(),
  origin_zipcode: z.string().regex(/^\d{5}-?\d{3}$/).optional().nullable(),
  preparation_days: z.number().int().min(0).max(30).optional(),
  shipping_notes: z.string().trim().max(1000).optional().nullable(),
  details: ProductDetailsSchema.optional().default({}),
  upsell_id: z.string().uuid().optional().nullable(),
  page_sections: ProductPageSectionsSchema.optional(),
}).strict();

export const CreateProductSchema = ProductPayloadSchema.superRefine((data, ctx) => {
  const isPhysical = data.type === "fisico" || data.product_kind === "physical";
  if (!isPhysical) return;

  const requiredPositiveFields = [
    ["weight_grams", data.weight_grams],
    ["width_cm", data.width_cm],
    ["height_cm", data.height_cm],
    ["length_cm", data.length_cm],
  ] as const;

  for (const [field, value] of requiredPositiveFields) {
    if (typeof value !== "number" || value <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Campo logistico obrigatorio para produto fisico" });
    }
  }

  if (!data.origin_zipcode) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["origin_zipcode"], message: "CEP de origem obrigatorio para produto fisico" });
  }
  if (data.track_inventory !== false && typeof data.stock_quantity !== "number") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stock_quantity"], message: "Estoque obrigatorio para produto fisico com controle de estoque" });
  }
});

export const UpdateProductSchema = ProductPayloadSchema.partial();
