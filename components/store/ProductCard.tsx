"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import type { Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { buttonHeightPx, buttonRadiusPx, coverHeightPx, radiusPx } from "@/lib/theme";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_TYPES } from "@/lib/product-types";

type ProductCardProps = {
  product: Product;
  theme: StoreTheme;
  index: number;
  username: string;
  onProductClick?: (product: Product) => void;
};

const shadowBySize = {
  none: "none",
  sm: "0 4px 14px",
  md: "0 12px 30px",
  lg: "0 22px 50px",
} as const;

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export default function ProductCard({
  product,
  theme,
  index,
  username,
  onProductClick,
}: ProductCardProps) {
  const href = `/${username}/${product.id}`;
  const typeMeta = PRODUCT_TYPES[product.type];
  const gradient = product.coverGradient ?? typeMeta.gradient;
  const hasCover = theme.cardLayout !== "text-only" && !!product.coverImage;
  const isHorizontal = theme.cardLayout === "cover-left" || theme.cardLayout === "cover-right";
  const isLeftList = theme.cardLayout === "cover-left" && theme.storeLayout === "list";
  const clickProps = onProductClick
    ? {
        onClick: (event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          onProductClick(product);
        },
      }
    : {};

  const cardStyle: CSSProperties = {
    background: theme.surfaceColor,
    borderRadius: radiusPx[theme.cardBorderRadius],
    borderWidth: theme.cardBorderWidth,
    borderColor: theme.cardBorderColor,
    borderStyle: theme.cardBorderWidth ? "solid" : "none",
    boxShadow: theme.cardShadow === "none" ? "none" : `${shadowBySize[theme.cardShadow]} ${theme.cardShadowColor}`,
    color: theme.textPrimaryColor,
    animationDelay: `${index * 70}ms`,
  };

  const buttonStyle: CSSProperties = {
    minHeight: buttonHeightPx[theme.buttonSize],
    borderRadius: buttonRadiusPx[theme.buttonRadius],
    fontWeight: theme.buttonWeight,
    textTransform: theme.buttonTransform,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    background: "#071317",
    borderWidth: 1,
    textDecoration: theme.buttonStyle === "underline" ? "underline" : "none",
  };

  const cover = hasCover ? (
    <div
      className={isHorizontal ? "relative flex shrink-0 items-center justify-center overflow-hidden" : "relative flex w-full items-center justify-center overflow-hidden"}
      style={{
        width: isLeftList ? "clamp(110px, 22vw, 168px)" : isHorizontal ? 84 : "100%",
        height: isLeftList ? "clamp(110px, 22vw, 168px)" : isHorizontal ? 84 : undefined,
        aspectRatio: isLeftList ? "1 / 1" : isHorizontal ? undefined : "40 / 21",
        borderRadius: Math.max(radiusPx[theme.cardBorderRadius] - 4, 0),
        background: product.coverImage ? theme.surfaceColor : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      }}
    >
      {product.coverImage && (
        <Image
          src={product.coverImage}
          alt=""
          fill
          sizes={isLeftList ? "(max-width: 640px) 110px, 168px" : isHorizontal ? "84px" : "(max-width: 768px) 100vw, 260px"}
          className={isLeftList ? "object-cover object-center" : "object-cover"}
          unoptimized={!canUseOptimizedImage(product.coverImage)}
        />
      )}
      {product.featured && <FeaturedBadge />}
    </div>
  ) : null;

  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`line-clamp-2 break-words text-[15px] font-semibold leading-snug [overflow-wrap:anywhere] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] ${isLeftList ? "" : "min-h-[40px]"}`}>
            {product.name}
          </h3>
        </div>
        {(theme.cardLayout === "text-only" || theme.buttonStyle === "underline") && (
          <ArrowRight className="mt-1 shrink-0" size={17} style={{ color: theme.accentColor }} />
        )}
      </div>
      {theme.showProductDescription && (
        <p className={`mt-2 line-clamp-2 break-words text-xs leading-relaxed [overflow-wrap:anywhere] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] ${isLeftList ? "" : "min-h-[40px]"}`} style={{ color: theme.textSecondaryColor }}>
          {product.shortDescription ?? product.description}
        </p>
      )}
      {theme.showProductRating && (
        <div className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: theme.accentColor }}>
          <Star size={12} fill="currentColor" />
          4.9
          <span style={{ color: theme.textSecondaryColor }}>({product.reviews?.length ?? 0})</span>
        </div>
      )}
      <p className="mt-2 text-base font-bold" style={{ color: theme.accentColor }}>
        {formatPrice(product.price)}
      </p>
      {theme.buttonStyle !== "underline" && (
        <div className={`${isLeftList ? "mt-2" : "mt-3"} grid place-items-center px-4 text-sm transition hover:opacity-85`} style={buttonStyle}>
          Comprar
        </div>
      )}
    </div>
  );

  return (
    <Link
      href={href}
      {...clickProps}
      className={`animate-card-in block overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] ${isLeftList ? "p-4" : "p-3"}`}
      style={cardStyle}
    >
      {theme.cardLayout === "cover-top" && (
        <div className="grid gap-3">
          {cover}
          {content}
        </div>
      )}
      {theme.cardLayout === "cover-left" && (
        <div className={isLeftList ? "flex items-start gap-3" : "flex items-center gap-3"}>
          {cover}
          {content}
        </div>
      )}
      {theme.cardLayout === "cover-right" && (
        <div className="flex items-center gap-3">
          {content}
          {cover}
        </div>
      )}
      {theme.cardLayout === "text-only" && content}
    </Link>
  );
}

function FeaturedBadge() {
  return (
    <span className="absolute right-2 top-2 z-10 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#F59E0B]">
      Destaque
    </span>
  );
}

