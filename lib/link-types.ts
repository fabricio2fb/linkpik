import {
  BookMarked,
  Facebook,
  Globe,
  Hash,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Music,
  Music2,
  Send,
  ShoppingBag,
  Tv2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { LinkType } from "./types";

export const LINK_TYPES = {
  instagram: { label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/seuperfil" },
  tiktok: { label: "TikTok", Icon: Music2, placeholder: "https://tiktok.com/@seuperfil" },
  youtube: { label: "YouTube", Icon: Youtube, placeholder: "https://youtube.com/@seucanal" },
  twitter: { label: "Twitter/X", Icon: Twitter, placeholder: "https://x.com/seuperfil" },
  facebook: { label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/seuperfil" },
  linkedin: { label: "LinkedIn", Icon: Linkedin, placeholder: "https://linkedin.com/in/seuperfil" },
  pinterest: { label: "Pinterest", Icon: BookMarked, placeholder: "https://pinterest.com/seuperfil" },
  twitch: { label: "Twitch", Icon: Tv2, placeholder: "https://twitch.tv/seucanal" },
  spotify: { label: "Spotify", Icon: Music, placeholder: "https://open.spotify.com/..." },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, placeholder: "5521999999999" },
  telegram: { label: "Telegram", Icon: Send, placeholder: "https://t.me/seuperfil" },
  discord: { label: "Discord", Icon: Hash, placeholder: "https://discord.gg/seuservidor" },
  website: { label: "Website", Icon: Globe, placeholder: "https://seusite.com.br" },
  store: { label: "Loja", Icon: ShoppingBag, placeholder: "https://sualoja.com.br" },
  email: { label: "Email", Icon: Mail, placeholder: "seuemail@gmail.com" },
  custom: { label: "Link", Icon: Link2, placeholder: "https://" },
} satisfies Record<LinkType, { label: string; Icon: LucideIcon; placeholder: string }>;

export const LINK_TYPE_IDS = Object.keys(LINK_TYPES) as LinkType[];

export function normalizeLinkUrl(type: LinkType, value: string) {
  const trimmed = value.trim();
  if (type === "whatsapp") return `https://wa.me/${trimmed.replace(/\D/g, "")}`;
  if (type === "email") return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
  return trimmed;
}

export function validateLinkValue(type: LinkType, value: string) {
  const trimmed = value.trim();
  if (type === "whatsapp") return trimmed.replace(/\D/g, "").length >= 10;
  if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.replace(/^mailto:/, ""));
  return trimmed.startsWith("https://");
}

