"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import type { Creator, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import {
  avatarSizePx,
  coverHeightPx,
  fontVars,
  getThemeBackground,
  letterSpacingValue,
  nameSizePx,
  pageMaxWidthPx,
} from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { getInitials } from "@/lib/utils";
import { LINK_TYPES } from "@/lib/link-types";
import ProductCard from "./ProductCard";
import PresentationVideo from "./PresentationVideo";

type StorePageProps = {
  creator: Creator;
  products: Product[];
  theme?: StoreTheme;
  accentColor?: string;
  embedded?: boolean;
  previewMode?: boolean;
  onProductClick?: (product: Product) => void;
  hideBranding?: boolean;
};

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export default function StorePage({
  creator,
  products,
  theme,
  accentColor,
  embedded = false,
  previewMode = false,
  onProductClick,
  hideBranding,
}: StorePageProps) {
  const initialTheme = theme ?? creator.theme ?? THEME_PRESETS[creator.template ?? "cards"];

  useEffect(() => {
    if (embedded || previewMode || !creator.username) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "store_view", username: creator.username }),
    }).catch(() => {});
  }, [creator.username, embedded, previewMode]);

  const activeCreator = creator;
  const activeProducts = products;
  const activeTheme = initialTheme;
  const resolvedTheme = accentColor ? { ...activeTheme, accentColor } : activeTheme;
  const sortedProducts = useMemo(
    () =>
      [...activeProducts].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }),
    [activeProducts],
  );

  const pageStyle: CSSProperties = {
    ...getThemeBackground(resolvedTheme),
    ["--font-heading" as string]: fontVars[resolvedTheme.fontHeading],
    ["--font-body" as string]: fontVars[resolvedTheme.fontBody],
    color: resolvedTheme.textPrimaryColor,
    fontFamily: "var(--font-body)",
  };

  const visibleCreatorLinks = activeCreator.links?.filter((link) => link.active !== false) ?? [];
  const socialLinks = visibleCreatorLinks.length
    ? visibleCreatorLinks
    : [
        activeCreator.socials.instagram ? { id: "instagram", type: "instagram" as const, label: "Instagram", url: activeCreator.socials.instagram } : null,
        activeCreator.socials.tiktok ? { id: "tiktok", type: "tiktok" as const, label: "TikTok", url: activeCreator.socials.tiktok } : null,
        activeCreator.socials.youtube ? { id: "youtube", type: "youtube" as const, label: "YouTube", url: activeCreator.socials.youtube } : null,
      ].filter((item) => item !== null);

  const contentStyle: CSSProperties | undefined = embedded ? { maxWidth: pageMaxWidthPx[resolvedTheme.pageMaxWidth] } : undefined;
  const productGridClass = "mx-auto grid w-full max-w-[760px] grid-cols-1 gap-4 pb-7 sm:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]";

  return (
    <main className={embedded ? "min-h-full overflow-hidden" : "min-h-screen overflow-hidden"} style={pageStyle}>
      <div className={`mx-auto flex min-h-full w-full flex-col px-5 py-6 ${embedded ? "" : "md:hidden"}`} style={contentStyle}>
        <Cover creator={activeCreator} theme={resolvedTheme} />
        <ProfileHeader creator={activeCreator} links={socialLinks} theme={resolvedTheme} previewMode={previewMode} />
        <BrandingDivider theme={resolvedTheme} />
        <VideoBlock creator={activeCreator} theme={resolvedTheme} previewMode={previewMode} />
        <AnnouncementBlock creator={activeCreator} theme={resolvedTheme} />
        <StoreSectionTitle theme={resolvedTheme} />
        <section className={`${productGridClass} items-start`}>
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={resolvedTheme}
              index={index}
              username={activeCreator.username}
              onProductClick={onProductClick}
            />
          ))}
        </section>
        {!hideBranding && (
          <footer className="mt-auto border-t px-1 py-6 text-center text-xs font-medium" style={{ borderColor: resolvedTheme.cardBorderColor, color: resolvedTheme.textSecondaryColor }}>
            Criado com{" "}
            <Link href={previewMode ? "#" : "/criar"} onClick={previewMode ? (event) => event.preventDefault() : undefined} className="font-semibold" style={{ color: resolvedTheme.textPrimaryColor }}>
              Pikbio
            </Link>
          </footer>
        )}
      </div>

      {!embedded && (
        <div className="mx-auto hidden min-h-screen w-full max-w-[1440px] flex-col px-6 py-10 md:flex">
          <div className="grid flex-1 grid-cols-[420px_minmax(0,1fr)] gap-8">
            <aside className="sticky top-10 h-fit border-r border-[var(--border-subtle)] py-4">
              <Cover creator={activeCreator} theme={resolvedTheme} desktop />
              <ProfileHeader creator={activeCreator} links={socialLinks} theme={resolvedTheme} avatarSizeOverride={90} previewMode={previewMode} />
              <BrandingDivider theme={resolvedTheme} />
              <VideoBlock creator={activeCreator} theme={resolvedTheme} previewMode={previewMode} desktop />
            </aside>

            <section className="min-w-0 py-4 pl-2">
              <AnnouncementBlock creator={activeCreator} theme={resolvedTheme} />
              <StoreSectionTitle theme={resolvedTheme} desktop />
              <div className="grid w-full items-start gap-5 pb-10 [grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]">
                {sortedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    theme={resolvedTheme}
                    index={index}
                    username={activeCreator.username}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            </section>
          </div>

          {!hideBranding && (
            <footer className="mt-8 border-t px-1 py-6 text-center text-xs font-medium" style={{ borderColor: resolvedTheme.cardBorderColor, color: resolvedTheme.textSecondaryColor }}>
              Criado com{" "}
              <Link href={previewMode ? "#" : "/criar"} onClick={previewMode ? (event) => event.preventDefault() : undefined} className="font-semibold" style={{ color: resolvedTheme.textPrimaryColor }}>
                Pikbio
              </Link>
            </footer>
          )}
        </div>
      )}
    </main>
  );
}

function Cover({ creator, theme, desktop = false }: { creator: Creator; theme: StoreTheme; desktop?: boolean }) {
  if (!creator.coverImage) return null;
  const isImageUrl = creator.coverImage.startsWith("data:") || creator.coverImage.startsWith("http");
  const coverH = coverHeightPx[theme.coverHeight] ?? 190;
  return (
    <section className={`relative z-[1] overflow-hidden ${desktop ? "mb-0 rounded-none" : "-mx-5 -mt-6 mb-0"}`} style={{ aspectRatio: "16/7", maxHeight: coverH }}>
      <div
        className="relative size-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundColor: theme.surfaceColor,
          background: isImageUrl ? theme.surfaceColor : creator.coverImage,
        }}
      >
        {isImageUrl && (
          <Image
            src={creator.coverImage}
            alt=""
            fill
            priority
            sizes={desktop ? "440px" : "100vw"}
            className="object-cover"
            unoptimized={!canUseOptimizedImage(creator.coverImage)}
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 50%, ${theme.backgroundColor} 100%)` }} />
      </div>
    </section>
  );
}

function BrandingDivider({ theme }: { theme: StoreTheme }) {
  return (
    <div className="mx-auto mb-5 mt-1 flex w-full max-w-[760px] items-center gap-3 px-1">
      <span className="h-px flex-1" style={{ backgroundColor: theme.cardBorderColor }} />
      <span className="size-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
      <span className="h-px flex-1" style={{ backgroundColor: theme.cardBorderColor }} />
    </div>
  );
}

function StoreSectionTitle({ theme, desktop = false }: { theme: StoreTheme; desktop?: boolean }) {
  return (
    <div className={`mx-auto w-full ${desktop ? "mb-4 max-w-none" : "mb-4 max-w-[760px] px-1"}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: theme.textSecondaryColor }}>
        Produtos
      </p>
      <div className="mt-2 h-px w-full" style={{ backgroundColor: theme.cardBorderColor }} />
    </div>
  );
}

function ProfileHeader({
  creator,
  links,
  theme,
  align = "center",
  avatarSizeOverride,
  overlapCover = true,
  previewMode = false,
}: {
  creator: Creator;
  links: NonNullable<Creator["links"]>;
  theme: StoreTheme;
  align?: "center" | "left";
  avatarSizeOverride?: number;
  overlapCover?: boolean;
  previewMode?: boolean;
}) {
  const avatarSize = avatarSizeOverride ?? avatarSizePx[theme.avatarSize];
  const avatarStyle: CSSProperties = {
    width: avatarSize,
    height: avatarSize,
    borderWidth: theme.avatarBorderWidth,
    borderColor: theme.avatarBorderColor,
    borderStyle: theme.avatarBorderWidth ? "solid" : "none",
    background: creator.avatarImage ? "transparent" : `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.42), transparent 24%), ${creator.avatarColor || theme.accentColor}`,
    boxShadow: theme.avatarShadow ? `0 10px 34px ${theme.accentColor}44` : "none",
    clipPath: theme.avatarShape === "hexagon" ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" : undefined,
    borderRadius: theme.avatarShape === "circle" ? 999 : theme.avatarShape === "square" ? 8 : theme.avatarShape === "rounded" ? 20 : 0,
  };
  const isLeft = align === "left";

  return (
    <section className={`relative z-10 px-1 pb-5 ${isLeft ? "text-left" : "text-center"} ${overlapCover && creator.coverImage && !isLeft ? "-mt-12 pt-0" : isLeft ? "pt-0" : "pt-5"}`}>
      <div className={`relative grid place-items-center overflow-hidden text-2xl font-bold text-white ${isLeft ? "" : "mx-auto"}`} style={avatarStyle}>
        {creator.avatarImage ? (
          <Image src={creator.avatarImage} alt="" fill sizes={`${avatarSize}px`} className="object-contain" unoptimized={!canUseOptimizedImage(creator.avatarImage)} />
        ) : (
          getInitials(creator.name)
        )}
      </div>
      <h1
        className="mt-5 leading-tight"
        style={{
          color: theme.textPrimaryColor,
          fontFamily: fontVars[theme.fontHeading],
          fontSize: nameSizePx[theme.nameSize],
          fontWeight: theme.nameWeight,
          textTransform: theme.nameTransform,
          letterSpacing: letterSpacingValue[theme.nameLetterSpacing],
        }}
      >
        {creator.name || "Seu nome"}
      </h1>
      <p className={`mt-3 max-w-xs text-sm leading-[1.6] ${isLeft ? "" : "mx-auto"}`} style={{ color: theme.textSecondaryColor }}>
        {creator.bio || "Sua bio aparece aqui"}
      </p>
      <SocialLinks links={links} theme={theme} align={align} previewMode={previewMode} />
    </section>
  );
}

function SocialLinks({ links, theme, align = "center", previewMode = false }: { links: NonNullable<Creator["links"]>; theme: StoreTheme; align?: "center" | "left"; previewMode?: boolean }) {
  if (!links.length) return null;

  const sizeClass = theme.linkSize === "lg" ? "text-sm" : theme.linkSize === "md" ? "text-[13px]" : "text-xs";
  const base = "inline-flex items-center justify-center gap-1.5 transition hover:-translate-y-px";
  const style: CSSProperties = {
    color: theme.linkStyle === "button" ? theme.buttonTextColor : theme.textPrimaryColor,
    background: theme.linkStyle === "pill" || theme.linkStyle === "button" ? theme.surfaceColor : "transparent",
    border: theme.linkStyle === "pill" || theme.linkStyle === "button" ? `1px solid ${theme.cardBorderColor}` : "none",
    borderRadius: theme.linkStyle === "button" ? 10 : 999,
    padding:
      theme.linkStyle === "pill" || theme.linkStyle === "button"
        ? theme.linkSize === "lg"
          ? "9px 16px"
          : theme.linkSize === "md"
            ? "7px 14px"
            : "6px 12px"
        : "4px",
  };

  return (
    <div className={`mt-5 flex max-w-sm flex-wrap gap-2 ${align === "left" ? "justify-start" : "mx-auto justify-center"}`}>
      {links.map((link, index) => {
        const Icon = LINK_TYPES[link.type].Icon;
        return (
          <a key={link.id} href={previewMode ? "#" : link.url} onClick={previewMode ? (event) => event.preventDefault() : undefined} className={`${base} ${sizeClass} font-medium`} style={style} aria-label={link.label}>
            {theme.linkStyle !== "text-only" && <Icon size={theme.linkSize === "lg" ? 18 : 16} />}
            {theme.linkStyle !== "icon-only" && <span>{link.label}{theme.linkStyle === "text-only" && index < links.length - 1 ? " /" : ""}</span>}
          </a>
        );
      })}
    </div>
  );
}

function Separator({ theme, align = "center" }: { theme: StoreTheme; align?: "center" | "left" }) {
  if (theme.separatorStyle === "none") return null;
  const width = theme.separatorWidth === "full" ? "100%" : theme.separatorWidth === "medium" ? 96 : 40;
  if (theme.separatorStyle === "dots") {
    return (
      <div className={`mb-5 flex gap-1.5 ${align === "left" ? "" : "mx-auto"}`} style={{ width: "max-content" }}>
        {[0, 1, 2].map((item) => <span key={item} className="size-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />)}
      </div>
    );
  }
  return <div className={`mb-5 h-px rounded-full ${align === "left" ? "" : "mx-auto"}`} style={{ width, backgroundColor: theme.separatorStyle === "accent-line" ? theme.accentColor : theme.cardBorderColor }} />;
}

function VideoBlock({ creator, theme, previewMode, desktop = false }: { creator: Creator; theme: StoreTheme; previewMode: boolean; desktop?: boolean }) {
  if (!creator.presentationVideo?.url) return null;
  const title = creator.presentationVideo.title?.trim() || "Veja em ação";
  const description = creator.presentationVideo.description?.trim() || "Assista ao vídeo de apresentação antes de escolher seu produto.";
  return (
    <div className={`w-full overflow-hidden ${desktop ? "mt-5 mb-0 [&>section]:p-0 [&>section>div]:rounded-xl" : "mb-5"}`} style={{ borderRadius: desktop ? 12 : 16 }}>
      <div className={desktop ? "mb-3" : "mb-3 px-1"}>
        <p className="font-heading text-base font-bold" style={{ color: theme.textPrimaryColor }}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-5" style={{ color: theme.textSecondaryColor }}>
          {description}
        </p>
      </div>
      <PresentationVideo video={creator.presentationVideo} accentColor={theme.accentColor} previewOnly={previewMode} />
    </div>
  );
}

function AnnouncementBlock({ creator, theme }: { creator: Creator; theme: StoreTheme }) {
  if (!creator.announcement?.enabled || !creator.announcement.text.trim()) return null;
  return (
    <div
      className="animate-fadeIn visible mx-1 mb-5 rounded-xl border px-4 py-[14px] text-center text-sm leading-[1.6]"
      style={{
        background: creator.announcement.background,
        borderColor: creator.announcement.border,
        color: theme.textPrimaryColor,
      }}
    >
      {creator.announcement.text}
    </div>
  );
}


