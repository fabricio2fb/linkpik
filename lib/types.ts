import type { StoreTheme } from "./theme";
import type { ProductPageSection } from "@/lib/product-page-sections";

export type Creator = {
  name: string;
  username: string;
  bio: string;
  avatarColor: string;
  avatarImage?: string | null;
  accentColor: string;
  template?: TemplateId;
  profileFont?: string;
  theme?: StoreTheme;
  coverImage?: string | null;
  presentationVideo?: {
    url: string;
    showThumbnail: boolean;
    title?: string;
    description?: string;
    caption?: string;
    thumbnail?: string;
  } | null;
  announcement?: {
    enabled: boolean;
    text: string;
    background: string;
    border: string;
  };
  links?: CreatorLink[];
  socials: { instagram?: string; tiktok?: string; youtube?: string };
};

export type TemplateId = "minimal" | "cards" | "glass" | "bold" | "magazine" | "retro" | "soft" | "cleanpro";
export type LinkType =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "pinterest"
  | "twitch"
  | "spotify"
  | "whatsapp"
  | "telegram"
  | "discord"
  | "website"
  | "store"
  | "email"
  | "custom";

export type CreatorLink = {
  id: string;
  type: LinkType;
  label: string;
  url: string;
  active?: boolean;
};

export type ProductType = "infoproduto" | "fisico" | "ebook" | "planilha" | "template" | "curso" | "mentoria" | "pack" | "comunidade";
export type ProductStatus = "active" | "draft" | "hidden";

export type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  type: ProductType;
  coverColor: string;
  description: string;
  includes: string[];
  reviews: Review[];
  active?: boolean;
  status?: ProductStatus;
  featured?: boolean;
  sales?: number;
  revenue?: number;
  coverImage?: string;
  imageProvider?: "cloudinary" | "supabase" | "external";
  imagePublicId?: string;
  imageUrl?: string;
  coverGradient?: string[];
  shortDescription?: string;
  level?: "Iniciante" | "Intermediário" | "Avançado";
  deliveryPlatform?: string;
  deliveryUrl?: string;
  pages?: number;
  language?: "Português" | "Inglês" | "Espanhol";
  compatibleWith?: string[];
  templatePlatform?: string;
  accessLink?: string;
  usageInstructions?: string;
  lessonCount?: number;
  duration?: string;
  coursePlatform?: string;
  courseUrl?: string;
  modules?: { id: string; name: string; lessons: number }[];
  prerequisites?: string;
  certificate?: boolean;
  sessionDuration?: string;
  sessionFormat?: string;
  schedulingMethod?: string;
  schedulingValue?: string;
  availability?: string;
  recordingIncluded?: boolean;
  seats?: number;
  fileCount?: number;
  fileTypes?: string[];
  totalSize?: string;
  license?: string;
  communityPlatform?: string;
  accessMethod?: string;
  contentFrequency?: string;
  members?: number;
  renewal?: string;
  billingType?: "one_time" | "subscription" | "free";
  subscriptionPeriod?: string;
  freeTrialDays?: number;
  leadFields?: string[];
  installments?: number;
  deliveryMessage?: string;
  thankYouMessage?: string;
  postPurchaseInstagram?: string;
  sku?: string;
  stock?: number;
  stockMinimum?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  originPostalCode?: string;
  preparationTime?: string;
  shippingNotes?: string;
  upsell?: {
    productId: string;
    price: number;
    originalPrice: number;
    buttonText: string;
    discount: number;
  } | null;
  pageSections?: ProductPageSection[];
};

export type Sale = {
  id: string;
  product: string;
  buyer: string;
  value: number;
  fee?: number;
  net?: number;
  method: "Mercado Pago";
  date: string;
  status: "Pago" | "Pendente";
  upsellProductId?: string;
  upsellValue?: number;
};

export type Metrics = {
  totalRevenue: number;
  todayRevenue: number;
  visitors: number;
  conversion: number;
};

export type MockUser = {
  name: string;
  email: string;
  username: string;
  avatar?: string | null;
  plan: "free" | "pro";
  payoutDestination: { type: "mercadopago"; value: string };
  bankData: {
    bank: string;
    accountType: "Corrente" | "Poupanca";
    agency: string;
    account: string;
    document: string;
    holder: string;
  };
  balance: { available: number; pending: number };
  notifications: {
    newSale: boolean;
    pixExpired: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    productNews: boolean;
    whatsappEnabled: boolean;
    whatsappNumber: string;
    pushEnabled: boolean;
  };
  integrations: {
    metaPixel: null | { pixelId: string; token: string };
    googleAnalytics: null | { measurementId: string };
    tiktokPixel: null | { pixelId: string; token: string };
    webhook: null | { url: string; events: string[]; secret: string };
  };
  domain: { custom: string | null; status: "pending" | "active" | null };
};

