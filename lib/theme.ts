import type { TemplateId } from "./types";

export type FontOption =
  | "Plus Jakarta Sans"
  | "DM Sans"
  | "Inter"
  | "Syne"
  | "Space Grotesk"
  | "Playfair Display"
  | "Nunito"
  | "Oswald"
  | "Bebas Neue"
  | "Lora";

export type StoreTheme = {
  template: TemplateId;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  buttonTextColor: string;
  backgroundType: "solid" | "gradient" | "mesh";
  backgroundGradient?: {
    from: string;
    to: string;
    angle: number;
  };
  fontHeading: FontOption;
  fontBody: FontOption;
  nameSize: "sm" | "md" | "lg" | "xl";
  nameWeight: 100 | 300 | 400 | 600 | 700 | 800 | 900;
  nameTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  nameLetterSpacing: "tight" | "normal" | "wide" | "wider";
  avatarShape: "circle" | "square" | "rounded" | "hexagon";
  avatarSize: "sm" | "md" | "lg";
  avatarBorderWidth: 0 | 2 | 4;
  avatarBorderColor: string;
  avatarShadow: boolean;
  storeLayout: "list" | "grid2" | "grid1";
  pageMaxWidth: "compact" | "medium" | "wide";
  cardBorderRadius: "none" | "sm" | "md" | "lg" | "xl";
  cardBorderWidth: 0 | 1 | 2;
  cardBorderColor: string;
  cardShadow: "none" | "sm" | "md" | "lg";
  cardShadowColor: string;
  showProductDescription: boolean;
  showProductRating: boolean;
  cardLayout: "cover-top" | "cover-left" | "cover-right" | "text-only";
  coverHeight: "sm" | "md" | "lg";
  buttonStyle: "filled" | "outline" | "ghost" | "underline";
  buttonRadius: "none" | "sm" | "md" | "lg" | "pill";
  buttonSize: "sm" | "md" | "lg";
  buttonWeight: 400 | 600 | 700 | 900;
  buttonTransform: "none" | "uppercase";
  linkStyle: "pill" | "icon-only" | "text-only" | "button";
  linkSize: "sm" | "md" | "lg";
  separatorStyle: "none" | "line" | "dots" | "accent-line";
  separatorWidth: "short" | "medium" | "full";
  themeMode: "dark" | "light";
};

export const fontVars: Record<FontOption, string> = {
  "Plus Jakarta Sans": "var(--font-plus-jakarta)",
  "DM Sans": "var(--font-dm-sans)",
  Inter: "var(--font-inter)",
  Syne: "var(--font-syne)",
  "Space Grotesk": "var(--font-space-grotesk)",
  "Playfair Display": "var(--font-playfair)",
  Nunito: "var(--font-nunito)",
  Oswald: "var(--font-oswald)",
  "Bebas Neue": "var(--font-bebas-neue)",
  Lora: "var(--font-lora)",
};

export const nameSizePx = { sm: 18, md: 22, lg: 26, xl: 32 } as const;
export const avatarSizePx = { sm: 64, md: 80, lg: 96 } as const;
export const pageMaxWidthPx = { compact: 480, medium: 600, wide: 720 } as const;
export const radiusPx = { none: 0, sm: 8, md: 16, lg: 20, xl: 28 } as const;
export const buttonRadiusPx = { none: 0, sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const buttonHeightPx = { sm: 36, md: 44, lg: 52 } as const;
export const coverHeightPx = { sm: 120, md: 160, lg: 200 } as const;
export const letterSpacingValue = { tight: "-0.03em", normal: "0", wide: "0.06em", wider: "0.14em" } as const;

export function getThemeBackground(theme: StoreTheme) {
  if (theme.backgroundType === "gradient" && theme.backgroundGradient) {
    return {
      background: `linear-gradient(${theme.backgroundGradient.angle}deg, ${theme.backgroundGradient.from}, ${theme.backgroundGradient.to})`,
    };
  }

  if (theme.backgroundType === "mesh") {
    const secondary = theme.backgroundGradient?.to ?? "#7C3AED";
    return {
      background: `radial-gradient(at 40% 20%, ${theme.accentColor}33 0px, transparent 50%), radial-gradient(at 80% 0%, ${secondary}24 0px, transparent 50%), radial-gradient(at 0% 80%, ${theme.accentColor}1f 0px, transparent 50%), ${theme.backgroundColor}`,
    };
  }

  return { backgroundColor: theme.backgroundColor };
}

export function isLightColor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export function autoTextForBackground(hex: string) {
  return isLightColor(hex)
    ? { textPrimaryColor: "#111827", textSecondaryColor: "#4B5563" }
    : { textPrimaryColor: "#ffffff", textSecondaryColor: "#888888" };
}

