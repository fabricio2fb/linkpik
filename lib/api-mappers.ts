import { PRODUCT_TYPES } from "@/lib/product-types";
import { ProductPageSectionsSchema } from "@/lib/product-page-sections";
import { THEME_PRESETS } from "@/lib/theme-presets";
import type { Creator, CreatorLink, LinkType, Product, ProductType, Sale } from "@/lib/types";

type ApiCreator = Record<string, unknown>;
type ApiProduct = Record<string, unknown>;
type ApiOrder = Record<string, unknown>;

function asProductType(value: unknown): ProductType {
  return typeof value === "string" && value in PRODUCT_TYPES ? (value as ProductType) : "infoproduto";
}

function asLinkType(value: unknown): LinkType {
  const allowed = new Set([
    "instagram",
    "tiktok",
    "youtube",
    "twitter",
    "facebook",
    "linkedin",
    "pinterest",
    "twitch",
    "spotify",
    "whatsapp",
    "telegram",
    "discord",
    "website",
    "store",
    "email",
    "custom",
  ]);
  return typeof value === "string" && allowed.has(value) ? (value as LinkType) : "custom";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mapPresentationVideo(value: unknown): Creator["presentationVideo"] {
  const row = asRecord(value);
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!url) return null;

  return {
    url,
    showThumbnail: typeof row.showThumbnail === "boolean" ? row.showThumbnail : true,
    title: typeof row.title === "string" ? row.title.slice(0, 80) : undefined,
    description: typeof row.description === "string" ? row.description.slice(0, 180) : undefined,
    caption: typeof row.caption === "string" ? row.caption.slice(0, 140) : undefined,
    thumbnail: typeof row.thumbnail === "string" ? row.thumbnail : undefined,
  };
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeZipcode(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 8 ? digits : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ""),
  ) as Partial<T>;
}

export function mapApiLinks(links?: unknown[]): CreatorLink[] {
  return (links ?? []).map((link) => {
    const row = link as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      type: asLinkType(row.type),
      label: String(row.label || row.type || "Link"),
      url: String(row.url || "#"),
      active: Boolean(row.is_active ?? true),
    };
  });
}

export function mapApiCreator(row: ApiCreator, links?: unknown[]): Creator {
  const themeRecord = asRecord(row.store_theme);
  const theme = (row.store_theme as Creator["theme"]) ?? THEME_PRESETS.cards;
  return {
    name: String(row.name || row.username || "Creator"),
    username: String(row.username || ""),
    bio: String(row.bio || ""),
    avatarImage: typeof row.avatar_url === "string" ? row.avatar_url : null,
    avatarColor: theme?.accentColor ?? "#FF4D6D",
    accentColor: theme?.accentColor ?? "#FF4D6D",
    template: theme?.template ?? "cards",
    theme,
    coverImage: typeof row.cover_url === "string" ? row.cover_url : null,
    presentationVideo: mapPresentationVideo(themeRecord.presentationVideo),
    announcement: { enabled: false, text: "", background: "rgba(255,77,109,0.10)", border: "rgba(255,77,109,0.30)" },
    links: mapApiLinks(links),
    socials: {},
  };
}

export function mapApiProduct(row: ApiProduct): Product {
  const type = asProductType(row.type);
  const meta = PRODUCT_TYPES[type];
  const description = String(row.description || "");
  const details = asRecord(row.details);
  const upsell = asRecord(details.upsell);
  const pageSections = ProductPageSectionsSchema.safeParse(row.page_sections).success
    ? ProductPageSectionsSchema.parse(row.page_sections)
    : [];

  return {
    id: String(row.id ?? ""),
    name: String(row.title || "Produto"),
    price: Number(row.price ?? 0),
    originalPrice: typeof details.originalPrice === "number" ? details.originalPrice : undefined,
    type,
    coverColor: typeof details.coverColor === "string" ? details.coverColor : meta.color,
    coverGradient: Array.isArray(details.coverGradient) ? details.coverGradient.map(String) : meta.gradient,
    description,
    shortDescription: typeof details.shortDescription === "string" ? details.shortDescription : description.slice(0, 120),
    includes: Array.isArray(details.includes) ? details.includes.map(String) : ["Acesso imediato", "Entrega por email"],
    reviews: Array.isArray(details.reviews)
      ? (details.reviews as Product["reviews"]).map((review) => ({ ...review, verified: false }))
      : [],
    active: Boolean(row.is_active ?? true),
    status: row.status === "draft" || row.status === "hidden" || row.status === "active"
      ? row.status
      : row.is_active === false ? "hidden" : "active",
    featured: Boolean(row.is_featured ?? false),
    coverImage: typeof row.image_url === "string" ? row.image_url : typeof row.cover_url === "string" ? row.cover_url : undefined,
    imageProvider: row.image_provider === "cloudinary" || row.image_provider === "supabase" || row.image_provider === "external" ? row.image_provider : undefined,
    imagePublicId: typeof row.image_public_id === "string" ? row.image_public_id : undefined,
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    level: details.level as Product["level"],
    deliveryPlatform: typeof details.deliveryPlatform === "string" ? details.deliveryPlatform : undefined,
    deliveryUrl: typeof details.deliveryUrl === "string" ? details.deliveryUrl : undefined,
    pages: typeof details.pages === "number" ? details.pages : undefined,
    language: details.language as Product["language"],
    compatibleWith: Array.isArray(details.compatibleWith) ? details.compatibleWith.map(String) : undefined,
    templatePlatform: typeof details.templatePlatform === "string" ? details.templatePlatform : undefined,
    accessLink: typeof details.accessLink === "string" ? details.accessLink : undefined,
    usageInstructions: typeof details.usageInstructions === "string" ? details.usageInstructions : undefined,
    lessonCount: typeof details.lessonCount === "number" ? details.lessonCount : undefined,
    duration: typeof details.duration === "string" ? details.duration : undefined,
    coursePlatform: typeof details.coursePlatform === "string" ? details.coursePlatform : undefined,
    courseUrl: typeof details.courseUrl === "string" ? details.courseUrl : undefined,
    modules: Array.isArray(details.modules) ? (details.modules as Product["modules"]) : undefined,
    prerequisites: typeof details.prerequisites === "string" ? details.prerequisites : undefined,
    certificate: typeof details.certificate === "boolean" ? details.certificate : undefined,
    sessionDuration: typeof details.sessionDuration === "string" ? details.sessionDuration : undefined,
    sessionFormat: typeof details.sessionFormat === "string" ? details.sessionFormat : undefined,
    schedulingMethod: typeof details.schedulingMethod === "string" ? details.schedulingMethod : undefined,
    schedulingValue: typeof details.schedulingValue === "string" ? details.schedulingValue : undefined,
    availability: typeof details.availability === "string" ? details.availability : undefined,
    recordingIncluded: typeof details.recordingIncluded === "boolean" ? details.recordingIncluded : undefined,
    seats: typeof details.seats === "number" ? details.seats : undefined,
    fileCount: typeof details.fileCount === "number" ? details.fileCount : undefined,
    fileTypes: Array.isArray(details.fileTypes) ? details.fileTypes.map(String) : undefined,
    totalSize: typeof details.totalSize === "string" ? details.totalSize : undefined,
    license: typeof details.license === "string" ? details.license : undefined,
    communityPlatform: typeof details.communityPlatform === "string" ? details.communityPlatform : undefined,
    accessMethod: typeof details.accessMethod === "string" ? details.accessMethod : undefined,
    contentFrequency: typeof details.contentFrequency === "string" ? details.contentFrequency : undefined,
    members: typeof details.members === "number" ? details.members : undefined,
    renewal: typeof details.renewal === "string" ? details.renewal : undefined,
    billingType: details.billingType === "subscription" || details.billingType === "free" || details.billingType === "one_time" ? details.billingType : "one_time",
    subscriptionPeriod: typeof details.subscriptionPeriod === "string" ? details.subscriptionPeriod : undefined,
    freeTrialDays: typeof details.freeTrialDays === "number" ? details.freeTrialDays : undefined,
    leadFields: Array.isArray(details.leadFields) ? details.leadFields.map(String) : undefined,
    installments: typeof details.installments === "number" ? details.installments : undefined,
    deliveryMessage: typeof details.deliveryMessage === "string" ? details.deliveryMessage : undefined,
    thankYouMessage: typeof details.thankYouMessage === "string" ? details.thankYouMessage : undefined,
    postPurchaseInstagram: typeof details.postPurchaseInstagram === "string" ? details.postPurchaseInstagram : undefined,
    sku: typeof row.sku === "string" ? row.sku : typeof details.sku === "string" ? details.sku : undefined,
    stock: typeof row.stock_quantity === "number" ? row.stock_quantity : typeof details.stock === "number" ? details.stock : undefined,
    stockMinimum: typeof row.stock_minimum === "number" ? row.stock_minimum : typeof details.stockMinimum === "number" ? details.stockMinimum : undefined,
    trackInventory: typeof row.track_inventory === "boolean" ? row.track_inventory : typeof details.trackInventory === "boolean" ? details.trackInventory : undefined,
    allowBackorder: typeof row.allow_backorder === "boolean" ? row.allow_backorder : typeof details.allowBackorder === "boolean" ? details.allowBackorder : undefined,
    weight: typeof row.weight_grams === "number" ? `${row.weight_grams}g` : typeof details.weight === "string" ? details.weight : undefined,
    height: typeof row.height_cm === "number" ? `${row.height_cm}cm` : typeof details.height === "string" ? details.height : undefined,
    width: typeof row.width_cm === "number" ? `${row.width_cm}cm` : typeof details.width === "string" ? details.width : undefined,
    length: typeof row.length_cm === "number" ? `${row.length_cm}cm` : typeof details.length === "string" ? details.length : undefined,
    originPostalCode: typeof row.origin_zipcode === "string" ? row.origin_zipcode : typeof details.originPostalCode === "string" ? details.originPostalCode : undefined,
    preparationTime: typeof row.preparation_days === "number" ? `${row.preparation_days} dias uteis` : typeof details.preparationTime === "string" ? details.preparationTime : undefined,
    shippingNotes: typeof row.shipping_notes === "string" ? row.shipping_notes : typeof details.shippingNotes === "string" ? details.shippingNotes : undefined,
    upsell: typeof row.upsell_id === "string"
      ? {
          productId: row.upsell_id,
          price: typeof upsell.price === "number" ? upsell.price : Number(row.price ?? 0),
          originalPrice: typeof upsell.originalPrice === "number" ? upsell.originalPrice : Number(row.price ?? 0),
          buttonText: typeof upsell.buttonText === "string" ? upsell.buttonText : "Sim, quero adicionar",
          discount: typeof upsell.discount === "number" ? upsell.discount : 0,
        }
      : null,
    pageSections,
  };
}

export function mapProductToApi(product: Product) {
  const coverUrl = product.coverImage && /^https?:\/\//.test(product.coverImage) ? product.coverImage : null;
  const details = {
    originalPrice: product.originalPrice,
    shortDescription: product.shortDescription,
    includes: product.includes,
    reviews: product.reviews,
    coverColor: product.coverColor,
    coverGradient: product.coverGradient,
    level: product.level,
    deliveryPlatform: product.deliveryPlatform,
    deliveryUrl: product.deliveryUrl,
    pages: product.pages,
    language: product.language,
    compatibleWith: product.compatibleWith,
    templatePlatform: product.templatePlatform,
    accessLink: product.accessLink,
    usageInstructions: product.usageInstructions,
    lessonCount: product.lessonCount,
    duration: product.duration,
    coursePlatform: product.coursePlatform,
    courseUrl: product.courseUrl,
    modules: product.modules,
    prerequisites: product.prerequisites,
    certificate: product.certificate,
    sessionDuration: product.sessionDuration,
    sessionFormat: product.sessionFormat,
    schedulingMethod: product.schedulingMethod,
    schedulingValue: product.schedulingValue,
    availability: product.availability,
    recordingIncluded: product.recordingIncluded,
    seats: product.seats,
    fileCount: product.fileCount,
    fileTypes: product.fileTypes,
    totalSize: product.totalSize,
    license: product.license,
    communityPlatform: product.communityPlatform,
    accessMethod: product.accessMethod,
    contentFrequency: product.contentFrequency,
    members: product.members,
    renewal: product.renewal,
    billingType: product.billingType,
    subscriptionPeriod: product.subscriptionPeriod,
    freeTrialDays: product.freeTrialDays,
    leadFields: product.leadFields,
    installments: product.installments,
    deliveryMessage: product.deliveryMessage,
    thankYouMessage: product.thankYouMessage,
    postPurchaseInstagram: product.postPurchaseInstagram,
    sku: product.sku,
    stock: product.stock,
    stockMinimum: product.stockMinimum,
    trackInventory: product.trackInventory,
    allowBackorder: product.allowBackorder,
    weight: product.weight,
    height: product.height,
    width: product.width,
    length: product.length,
    originPostalCode: product.originPostalCode,
    preparationTime: product.preparationTime,
    shippingNotes: product.shippingNotes,
    upsell: product.upsell,
  };

  return compactObject({
    title: product.name,
    description: product.description,
    price: product.price,
    type: product.type,
    product_kind: product.type === "fisico" ? "physical" : "digital",
    cover_url: coverUrl,
    image_provider: product.imageProvider,
    image_public_id: product.imagePublicId,
    image_url: product.imageUrl ?? coverUrl,
    is_active: (product.status ?? "active") === "active",
    status: product.status ?? "active",
    is_featured: Boolean(product.featured),
    sku: product.type === "fisico" ? product.sku?.trim() || null : undefined,
    stock_quantity: product.type === "fisico" ? product.stock ?? 0 : undefined,
    stock_minimum: product.type === "fisico" ? product.stockMinimum ?? 0 : undefined,
    track_inventory: product.type === "fisico" ? product.trackInventory ?? true : undefined,
    allow_backorder: product.type === "fisico" ? product.allowBackorder ?? false : undefined,
    weight_grams: product.type === "fisico" ? parseNumber(product.weight) : undefined,
    height_cm: product.type === "fisico" ? parseNumber(product.height) : undefined,
    width_cm: product.type === "fisico" ? parseNumber(product.width) : undefined,
    length_cm: product.type === "fisico" ? parseNumber(product.length) : undefined,
    origin_zipcode: product.type === "fisico" ? normalizeZipcode(product.originPostalCode) : undefined,
    preparation_days: product.type === "fisico" ? parseNumber(product.preparationTime) ?? 2 : undefined,
    shipping_notes: product.type === "fisico" ? product.shippingNotes ?? null : undefined,
    details: compactObject(details),
    upsell_id: product.upsell?.productId ?? null,
    page_sections: product.pageSections,
  });
}

export function mapApiOrder(row: ApiOrder): Sale {
  const amount = Number(row.amount ?? 0);
  const fee = Number(row.platform_fee ?? 0);
  const net = Number(row.creator_amount ?? amount - fee);

  return {
    id: String(row.id ?? ""),
    product: String(row.product_title || row.product_id || "Produto"),
    buyer: String(row.buyer_email || row.buyer_name || ""),
    value: amount,
    fee,
    net,
    method: "Mercado Pago",
    date: typeof row.created_at === "string" ? new Date(row.created_at).toLocaleDateString("pt-BR") : "",
    status: row.status === "paid" ? "Pago" : "Pendente",
    upsellProductId: typeof row.upsell_id === "string" ? row.upsell_id : undefined,
  };
}
