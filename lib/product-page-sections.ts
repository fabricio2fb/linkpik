import { z } from "zod";
import type { Product } from "@/lib/types";

const IdSchema = z.string().min(1).max(80);
const TextSchema = z.string().max(5000);
const ShortTextSchema = z.string().max(500);
const UrlSchema = z.string().url().max(1000).or(z.literal(""));

const BaseSectionSchema = z.object({ id: IdSchema });

const HeadingSectionSchema = BaseSectionSchema.extend({
  type: z.literal("heading"),
  data: z.object({ text: z.string().min(1).max(180), size: z.enum(["large", "medium"]) }).strict(),
}).strict();

const ParagraphSectionSchema = BaseSectionSchema.extend({
  type: z.literal("paragraph"),
  data: z.object({ content: TextSchema }).strict(),
}).strict();

const QuoteSectionSchema = BaseSectionSchema.extend({
  type: z.literal("quote"),
  data: z.object({ text: TextSchema }).strict(),
}).strict();

const ChecklistSectionSchema = BaseSectionSchema.extend({
  type: z.literal("checklist"),
  data: z.object({ items: z.array(ShortTextSchema).max(30) }).strict(),
}).strict();

const FaqSectionSchema = BaseSectionSchema.extend({
  type: z.literal("faq"),
  data: z.object({ items: z.array(z.object({ question: ShortTextSchema, answer: TextSchema }).strict()).max(20) }).strict(),
}).strict();

const ImageSectionSchema = BaseSectionSchema.extend({
  type: z.literal("image"),
  data: z.object({ url: UrlSchema }).strict(),
}).strict();

const ImageTextSectionSchema = BaseSectionSchema.extend({
  type: z.literal("image_text"),
  data: z.object({ url: UrlSchema, heading: z.string().max(180), text: TextSchema, side: z.enum(["left", "right"]) }).strict(),
}).strict();

const VideoSectionSchema = BaseSectionSchema.extend({
  type: z.literal("video"),
  data: z.object({ url: UrlSchema }).strict(),
}).strict();

const GallerySectionSchema = BaseSectionSchema.extend({
  type: z.literal("gallery"),
  data: z.object({ images: z.array(UrlSchema).max(12) }).strict(),
}).strict();

const TestimonialsSectionSchema = BaseSectionSchema.extend({
  type: z.literal("testimonials"),
  data: z.object({ items: z.array(z.object({ name: ShortTextSchema, text: TextSchema, avatar_url: UrlSchema.optional() }).strict()).max(12) }).strict(),
}).strict();

const StatsSectionSchema = BaseSectionSchema.extend({
  type: z.literal("stats"),
  data: z.object({ items: z.array(z.object({ value: z.string().max(60), label: ShortTextSchema }).strict()).max(8) }).strict(),
}).strict();

const TableSectionSchema = BaseSectionSchema.extend({
  type: z.literal("table"),
  data: z.object({ headers: z.array(ShortTextSchema).min(1).max(6), rows: z.array(z.array(ShortTextSchema).max(6)).max(20) }).strict(),
}).strict();

const DividerSectionSchema = BaseSectionSchema.extend({
  type: z.literal("divider"),
  data: z.object({}).strict(),
}).strict();

const SpacerSectionSchema = BaseSectionSchema.extend({
  type: z.literal("spacer"),
  data: z.object({ size: z.enum(["small", "medium", "large"]) }).strict(),
}).strict();

const ColumnsSectionSchema = BaseSectionSchema.extend({
  type: z.literal("columns"),
  data: z.object({ items: z.array(z.object({ icon: z.string().max(40), title: z.string().max(120), text: TextSchema }).strict()).max(6) }).strict(),
}).strict();

const CtaButtonSectionSchema = BaseSectionSchema.extend({
  type: z.literal("cta_button"),
  data: z.object({ label: z.string().min(1).max(80), style: z.enum(["primary", "secondary"]), url: z.string().max(1000).optional() }).strict(),
}).strict();

const BuyButtonSectionSchema = BaseSectionSchema.extend({
  type: z.literal("buy_button"),
  data: z.object({}).strict(),
}).strict();

export const ProductPageSectionSchema = z.discriminatedUnion("type", [
  HeadingSectionSchema,
  ParagraphSectionSchema,
  QuoteSectionSchema,
  ChecklistSectionSchema,
  FaqSectionSchema,
  ImageSectionSchema,
  ImageTextSectionSchema,
  VideoSectionSchema,
  GallerySectionSchema,
  TestimonialsSectionSchema,
  StatsSectionSchema,
  TableSectionSchema,
  DividerSectionSchema,
  SpacerSectionSchema,
  ColumnsSectionSchema,
  CtaButtonSectionSchema,
  BuyButtonSectionSchema,
]);

export const ProductPageSectionsSchema = z.array(ProductPageSectionSchema).max(40);

export type ProductPageSection = z.infer<typeof ProductPageSectionSchema>;
export type ProductPageSectionType = ProductPageSection["type"];

export const SECTION_LABELS: Record<ProductPageSectionType, string> = {
  heading: "Titulo",
  paragraph: "Paragrafo",
  quote: "Citação",
  checklist: "Checklist",
  faq: "FAQ",
  image: "Imagem",
  image_text: "Imagem + texto",
  video: "Video",
  gallery: "Galeria",
  testimonials: "Depoimentos",
  stats: "Numeros",
  table: "Tabela",
  divider: "Divisor",
  spacer: "Espacador",
  columns: "Colunas",
  cta_button: "CTA",
  buy_button: "Botao de compra",
};

export const SECTION_TYPES = Object.keys(SECTION_LABELS) as ProductPageSectionType[];

export function createProductPageSection(type: ProductPageSectionType): ProductPageSection {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  const base = { id, type } as const;
  switch (type) {
    case "heading":
      return { ...base, type, data: { text: "Novo titulo", size: "medium" } };
    case "paragraph":
      return { ...base, type, data: { content: "Escreva o conteudo desta secao." } };
    case "quote":
      return { ...base, type, data: { text: "Uma frase de destaque sobre o produto." } };
    case "checklist":
      return { ...base, type, data: { items: ["Acesso imediato", "Conteudo completo"] } };
    case "faq":
      return { ...base, type, data: { items: [{ question: "Como recebo o acesso?", answer: "Depois do pagamento confirmado, o acesso e enviado automaticamente por email." }] } };
    case "image":
      return { ...base, type, data: { url: "" } };
    case "image_text":
      return { ...base, type, data: { url: "", heading: "Destaque visual", text: "Explique esta parte do produto.", side: "left" } };
    case "video":
      return { ...base, type, data: { url: "" } };
    case "gallery":
      return { ...base, type, data: { images: [] } };
    case "testimonials":
      return { ...base, type, data: { items: [{ name: "Cliente", text: "Depoimento sobre a experiencia.", avatar_url: "" }] } };
    case "stats":
      return { ...base, type, data: { items: [{ value: "100+", label: "clientes atendidos" }] } };
    case "table":
      return { ...base, type, data: { headers: ["Item", "Detalhe"], rows: [["Acesso", "Imediato"]] } };
    case "divider":
      return { ...base, type, data: {} };
    case "spacer":
      return { ...base, type, data: { size: "medium" } };
    case "columns":
      return { ...base, type, data: { items: [{ icon: "check", title: "Beneficio", text: "Explique o beneficio." }, { icon: "star", title: "Resultado", text: "Mostre o resultado esperado." }] } };
    case "cta_button":
      return { ...base, type, data: { label: "Tem duvidas? Fale comigo", style: "secondary", url: "" } };
    case "buy_button":
      return { ...base, type, data: {} };
  }
}

export function buildDefaultProductPageSections(product: Product): ProductPageSection[] {
  const sections: ProductPageSection[] = [];
  if (product.coverImage) sections.push({ id: "cover", type: "image", data: { url: product.coverImage } });
  sections.push({ id: "title", type: "heading", data: { text: product.name, size: "large" } });
  if (product.description) sections.push({ id: "description", type: "paragraph", data: { content: product.description } });
  if (product.includes?.length) sections.push({ id: "includes", type: "checklist", data: { items: product.includes } });
  sections.push({ id: "buy", type: "buy_button", data: {} });
  return sections;
}

export function countBuyButtons(sections: ProductPageSection[]) {
  return sections.filter((section) => section.type === "buy_button").length;
}

export function productRequiresBuyButton(product: Pick<Product, "price" | "billingType">) {
  return Number(product.price ?? 0) > 0 && product.billingType !== "free";
}

