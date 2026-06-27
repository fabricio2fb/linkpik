"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, PackageCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import BuyModal from "@/components/store/BuyModal";
import ProductPageSections from "@/components/store/ProductPageSections";
import Toast from "@/components/ui/Toast";
import type { Creator, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { buttonHeightPx, buttonRadiusPx, fontVars, getThemeBackground, radiusPx } from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { formatPrice, getInitials } from "@/lib/utils";
import { PRODUCT_TYPES } from "@/lib/product-types";

type ProductPageProps = {
  creator: Creator;
  product: Product;
  otherProducts: Product[];
  theme?: StoreTheme;
  embedded?: boolean;
  embeddedCheckout?: boolean;
  onBack?: () => void;
  onProductChange?: (product: Product) => void;
};

export default function ProductPage({
  creator,
  product,
  otherProducts,
  theme,
  embedded = false,
  embeddedCheckout = false,
  onBack,
  onProductChange,
}: ProductPageProps) {
  const router = useRouter();
  const initialTheme = theme ?? creator.theme ?? THEME_PRESETS[creator.template ?? "cards"];
  const activeTheme = initialTheme;
  const activeCreator = creator;
  const activeProduct = product;
  const activeOtherProducts = otherProducts;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const forceMobile = embedded;

  useEffect(() => {
    if (embedded || !activeCreator.username || !activeProduct.id) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "product_view", username: activeCreator.username, product_id: activeProduct.id }),
    }).catch(() => {});
  }, [activeCreator.username, activeProduct.id, embedded]);

  useEffect(() => {
    if (embedded) return;
    function onScroll() {
      setShowSticky(window.scrollY > 300);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [embedded]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }

  const pageStyle: CSSProperties = {
    ...getThemeBackground(activeTheme),
    ["--font-heading" as string]: fontVars[activeTheme.fontHeading],
    ["--font-body" as string]: fontVars[activeTheme.fontBody],
    color: activeTheme.textPrimaryColor,
    fontFamily: "var(--font-body)",
  };
  const sectionStyle: CSSProperties = {
    background: activeTheme.surfaceColor,
    borderColor: activeTheme.cardBorderColor,
    borderRadius: radiusPx[activeTheme.cardBorderRadius],
    color: activeTheme.textPrimaryColor,
  };
  const buttonStyle: CSSProperties = {
    minHeight: buttonHeightPx[activeTheme.buttonSize],
    borderRadius: buttonRadiusPx[activeTheme.buttonRadius],
    fontWeight: activeTheme.buttonWeight,
    textTransform: activeTheme.buttonTransform,
    border: activeTheme.buttonStyle === "outline" ? `1px solid ${activeTheme.accentColor}` : "none",
    background:
      activeTheme.buttonStyle === "filled"
        ? activeTheme.accentColor
        : activeTheme.buttonStyle === "ghost"
          ? `${activeTheme.accentColor}18`
          : "transparent",
    color: activeTheme.buttonStyle === "filled" ? activeTheme.buttonTextColor : activeTheme.accentColor,
    textDecoration: activeTheme.buttonStyle === "underline" ? "underline" : "none",
  };
  const goBack = onBack ?? (() => router.back());

  if (embeddedCheckout && selectedProduct) {
    return (
      <BuyModal
        product={selectedProduct}
        products={[activeProduct, ...activeOtherProducts]}
        username={activeCreator.username}
        accentColor={activeTheme.accentColor}
        onClose={() => setSelectedProduct(null)}
        onToast={showToast}
        stayInModal
        embedded
      />
    );
  }

  return (
    <main className={embedded ? "min-h-full pb-8" : "min-h-screen pb-40 lg:pb-8"} style={pageStyle}>
      <div className={`mx-auto w-full max-w-[480px] pb-28 ${forceMobile ? "" : "lg:hidden"}`}>
        <button type="button" onClick={goBack} className="mx-5 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold backdrop-blur" style={{ background: activeTheme.surfaceColor, color: activeTheme.textSecondaryColor }} aria-label="Voltar">
          <ArrowLeft size={16} />
          Voltar
        </button>
        <ProductPageSections product={activeProduct} theme={activeTheme} sections={activeProduct.pageSections} onBuy={() => setSelectedProduct(activeProduct)} />
        <CreatorSection creator={activeCreator} theme={activeTheme} sectionStyle={sectionStyle} forceMobile={forceMobile} />
        <OtherProducts products={activeOtherProducts} creator={activeCreator} theme={activeTheme} forceMobile onProductClick={onProductChange} />
      </div>

      <div className={`mx-auto w-full max-w-[1120px] grid-cols-[410px_1px_minmax(0,1fr)] px-8 py-8 ${forceMobile ? "hidden" : "hidden lg:grid"}`}>
        <aside className="sticky top-6 h-fit max-h-[calc(100vh-48px)] overflow-y-auto pr-7 store-scrollbar">
          <button type="button" onClick={goBack} className="mb-4 inline-flex items-center gap-2 text-sm font-bold" style={{ color: activeTheme.textSecondaryColor }}>
            <ArrowLeft size={16} />
            Voltar
          </button>
          <CreatorSection creator={activeCreator} theme={activeTheme} sectionStyle={sectionStyle} className="mt-5" />
        </aside>
        <div className="my-0" style={{ background: activeTheme.cardBorderColor }} />
        <div className="grid min-w-0 content-start gap-5 pl-7">
          <ProductPageSections product={activeProduct} theme={activeTheme} sections={activeProduct.pageSections} onBuy={() => setSelectedProduct(activeProduct)} compact />
          <OtherProducts products={activeOtherProducts} creator={activeCreator} theme={activeTheme} onProductClick={onProductChange} />
        </div>
      </div>

      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur lg:hidden" style={{ background: activeTheme.surfaceColor, borderColor: activeTheme.cardBorderColor }}>
          <div className="mx-auto flex max-w-[480px] items-center gap-3">
            <p className="flex-1 text-lg font-extrabold" style={{ color: activeTheme.accentColor }}>{formatPrice(activeProduct.price)}</p>
            <button type="button" onClick={() => setSelectedProduct(activeProduct)} className="px-5 text-sm" style={buttonStyle}>
              Comprar
            </button>
          </div>
        </div>
      )}

      <BuyModal product={selectedProduct} products={[activeProduct, ...activeOtherProducts]} username={activeCreator.username} accentColor={activeTheme.accentColor} onClose={() => setSelectedProduct(null)} onToast={showToast} />
      <Toast message={toast} />
    </main>
  );
}

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function ProductCover({
  product,
  theme,
  className,
  priority = false,
  sizes,
  coverRatio,
}: {
  product: Product;
  theme: StoreTheme;
  className: string;
  priority?: boolean;
  sizes: string;
  coverRatio?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: theme.surfaceColor, aspectRatio: coverRatio ?? "40 / 21" }}>
      <Image
        src={product.coverImage!}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        unoptimized={!canUseOptimizedImage(product.coverImage!)}
      />
    </div>
  );
}

function ProductIntro({
  product,
  theme,
  buttonStyle,
  onBuy,
  compact = false,
  forceMobile = false,
  hideDescription = false,
}: {
  product: Product;
  theme: StoreTheme;
  buttonStyle: CSSProperties;
  onBuy: () => void;
  compact?: boolean;
  forceMobile?: boolean;
  hideDescription?: boolean;
}) {
  const isPhysical = product.type === "fisico";
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const hasLongDescription = product.description.length > 260;
  return (
    <section className={compact ? "" : "px-5 py-6"}>
      <h1 className={`font-heading text-2xl font-bold leading-tight tracking-[-0.5px] ${forceMobile ? "" : "lg:text-[28px]"}`} style={{ fontFamily: fontVars[theme.fontHeading] }}>
        {product.name}
      </h1>
      <p className="mt-2 text-sm" style={{ color: theme.textSecondaryColor }}>
        {isPhysical ? "Entrega fisica com rastreio" : "Acesso imediato"}
      </p>
      <div className="mt-4 flex items-end gap-3">
        {product.originalPrice && <p className="pb-1 text-base font-semibold line-through" style={{ color: theme.textSecondaryColor }}>{formatPrice(product.originalPrice)}</p>}
        <p className="text-[28px] font-extrabold" style={{ color: theme.accentColor }}>{formatPrice(product.price)}</p>
      </div>
      {!hideDescription && (
        <div className="mt-3">
          <p
            className={`max-w-full whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere] ${
              hasLongDescription && !descriptionExpanded ? "line-clamp-5 [-webkit-box-orient:vertical] [-webkit-line-clamp:5] [display:-webkit-box]" : ""
            }`}
            style={{ color: theme.textSecondaryColor }}
          >
            {product.description}
          </p>
          {hasLongDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((current) => !current)}
              className="mt-2 text-sm font-bold transition hover:opacity-80"
              style={{ color: theme.accentColor }}
            >
              {descriptionExpanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      )}
      <button type="button" onClick={onBuy} className="mt-5 w-full px-5 text-base" style={buttonStyle}>
        Comprar agora - {formatPrice(product.price)}
      </button>
    </section>
  );
}

function IncludedSection({ product, theme, sectionStyle, compact = false, forceMobile = false }: { product: Product; theme: StoreTheme; sectionStyle: CSSProperties; compact?: boolean; forceMobile?: boolean }) {
  return (
    <section className={compact ? "border p-5" : `mx-5 rounded-2xl border p-5 ${forceMobile ? "" : "lg:mx-0"}`} style={sectionStyle}>
      <h2 className="font-heading text-lg font-bold">O que está incluído</h2>
      <div className="mt-4 grid gap-2.5">
        {product.includes.map((item) => (
          <div key={item} className="flex gap-3 text-sm">
            <Check size={18} className="shrink-0" style={{ color: theme.accentColor }} />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PhysicalDeliverySection({ product, theme, sectionStyle, compact = false, forceMobile = false }: { product: Product; theme: StoreTheme; sectionStyle: CSSProperties; compact?: boolean; forceMobile?: boolean }) {
  if (product.type !== "fisico") return null;

  const dimensions = [product.width, product.length, product.height].filter(Boolean).join(" x ");
  const preparation = product.preparationTime ?? "2 dias uteis";
  const stockText = product.stock !== undefined ? `${product.stock} unidade${product.stock === 1 ? "" : "s"} disponiveis` : "Estoque sob consulta";

  return (
    <section className={compact ? "border p-5" : `mx-5 rounded-2xl border p-5 ${forceMobile ? "" : "lg:mx-0"}`} style={sectionStyle}>
      <h2 className="font-heading text-lg font-bold">Entrega e estoque</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DeliveryItem label="Estoque" value={stockText} theme={theme} />
        <DeliveryItem label="Preparo" value={preparation} theme={theme} />
        {product.weight && <DeliveryItem label="Peso" value={product.weight} theme={theme} />}
        {dimensions && <DeliveryItem label="Medidas" value={dimensions} theme={theme} />}
      </div>
      <p className="mt-4 break-words text-xs leading-5 [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>
        Informe seu CEP no checkout para calcular o frete e escolher a melhor forma de envio.
      </p>
      <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: theme.cardBorderColor, background: `${theme.accentColor}08` }}>
        <div className="flex gap-3">
          <PackageCheck size={18} className="shrink-0" style={{ color: theme.accentColor }} />
          <div>
            <p className="text-sm font-bold" style={{ color: theme.textPrimaryColor }}>Entrega feita pelo criador</p>
            <p className="mt-1 break-words text-xs leading-5 [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>
              O produto e enviado diretamente pelo criador. O Pikbio organiza o pedido, pagamento, endereco e acompanhamento, mas a postagem e feita pelo vendedor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliveryItem({ label, value, theme }: { label: string; value: string; theme: StoreTheme }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: theme.cardBorderColor, background: `${theme.accentColor}08` }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: theme.textSecondaryColor }}>{label}</p>
      <p className="mt-1 text-sm font-bold" style={{ color: theme.textPrimaryColor }}>{value}</p>
    </div>
  );
}

function ReviewsSection({ reviews, averageRating, theme, compact = false }: { reviews: Product["reviews"]; averageRating: number; theme: StoreTheme; compact?: boolean }) {
  return (
    <section className={compact ? "" : "px-5 py-6"}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Avaliações</h2>
        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: theme.accentColor }}>
          {averageRating.toFixed(1)} <Star size={15} fill="currentColor" /> <span style={{ color: theme.textSecondaryColor }}>({reviews.length})</span>
        </div>
      </div>
      <div className="mt-5 divide-y" style={{ borderColor: theme.cardBorderColor }}>
        {reviews.slice(0, 4).map((review) => (
          <article key={review.id} className="py-5 first:pt-0">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: review.avatar }}>
                {getInitials(review.author)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{review.author}</p>
                  <span className="flex text-xs" style={{ color: theme.accentColor }}>
                    {Array.from({ length: review.rating }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </span>
                  <span className="text-xs" style={{ color: theme.textSecondaryColor }}>{review.date}</span>
                </div>
                <p className="mt-2 max-w-full break-words text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>{review.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreatorSection({
  creator,
  theme,
  sectionStyle,
  forceMobile = false,
  className = "",
}: {
  creator: Creator;
  theme: StoreTheme;
  sectionStyle: CSSProperties;
  forceMobile?: boolean;
  className?: string;
}) {
  return (
    <section className={`mx-5 rounded-2xl border p-4 ${forceMobile ? "" : "lg:mx-0"} ${className}`} style={sectionStyle}>
      <div className="flex items-center gap-3">
        <div className="relative grid size-14 place-items-center overflow-hidden rounded-full text-sm font-bold text-white" style={{ backgroundColor: creator.avatarColor }}>
          {creator.avatarImage ? (
            <Image src={creator.avatarImage} alt="" fill sizes="56px" className="object-contain" unoptimized={!canUseOptimizedImage(creator.avatarImage)} />
          ) : (
            getInitials(creator.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-bold">{creator.name}</h2>
          <p className="mt-1 max-w-full break-words text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>{creator.bio}</p>
        </div>
      </div>
      <Link
        href={forceMobile ? "#" : `/${creator.username}`}
        onClick={forceMobile ? (event) => event.preventDefault() : undefined}
        className="mt-4 grid h-10 place-items-center rounded-[12px] border text-sm font-bold"
        style={{ borderColor: theme.cardBorderColor }}
      >
        Ver loja completa
      </Link>
    </section>
  );
}

function OtherProducts({ products, creator, theme, forceMobile = false, onProductClick }: { products: Product[]; creator: Creator; theme: StoreTheme; forceMobile?: boolean; onProductClick?: (product: Product) => void }) {
  if (!products.length) return null;
  if (!forceMobile) {
    return (
      <section className="py-7 lg:py-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold">Outros produtos</h2>
            <p className="mt-1 text-sm" style={{ color: theme.textSecondaryColor }}>Mais opções da loja para continuar comprando.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((item) => {
            const content = (
              <>
              {item.coverImage && (
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl transition group-hover:brightness-110" style={{ aspectRatio: "40 / 21", background: theme.surfaceColor }}>
                  <Image src={item.coverImage} alt="" fill sizes="(max-width: 1279px) 50vw, 220px" className="object-cover" unoptimized={!canUseOptimizedImage(item.coverImage)} />
                </div>
              )}
              <h3 className={`${item.coverImage ? "mt-3" : ""} line-clamp-2 min-h-[40px] break-words text-sm font-bold leading-snug [overflow-wrap:anywhere]`}>{item.name}</h3>
              <p className="mt-2 text-sm font-extrabold" style={{ color: theme.accentColor }}>{formatPrice(item.price)}</p>
              </>
            );
            if (onProductClick) {
              return (
                <button key={item.id} type="button" onClick={() => onProductClick(item)} className="group rounded-2xl border p-3 text-left transition hover:-translate-y-1 hover:opacity-90" style={{ background: theme.surfaceColor, borderColor: theme.cardBorderColor }}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={item.id} href={`/${creator.username}/${item.id}`} className="group rounded-2xl border p-3 transition hover:-translate-y-1 hover:opacity-90" style={{ background: theme.surfaceColor, borderColor: theme.cardBorderColor }}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }
  return (
    <section className="py-7">
      <h2 className="px-5 font-heading text-lg font-bold">Outros produtos</h2>
      <div className="relative mt-4">
        <div className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scroll-padding-left:20px] [-webkit-overflow-scrolling:touch]">
          {products.map((item) => {
            const content = (
              <>
              {item.coverImage && (
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl" style={{ aspectRatio: "40 / 21", background: theme.surfaceColor }}>
                  <Image src={item.coverImage} alt="" fill sizes="160px" className="object-cover" unoptimized={!canUseOptimizedImage(item.coverImage)} />
                </div>
              )}
              <h3 className={`${item.coverImage ? "mt-3" : ""} line-clamp-2 min-h-[34px] overflow-hidden break-words text-[13px] font-semibold leading-[1.3] [overflow-wrap:anywhere]`}>{item.name}</h3>
              <p className="mt-2 text-[13px] font-bold" style={{ color: theme.accentColor }}>{formatPrice(item.price)}</p>
              </>
            );
            if (onProductClick) {
              return (
                <button key={item.id} type="button" onClick={() => onProductClick(item)} className="w-[160px] min-w-[160px] shrink-0 snap-start rounded-2xl border p-[10px] text-left transition hover:opacity-80" style={{ background: theme.surfaceColor, borderColor: theme.cardBorderColor }}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={item.id} href={`/${creator.username}/${item.id}`} className="w-[160px] min-w-[160px] shrink-0 snap-start rounded-2xl border p-[10px] transition hover:opacity-80" style={{ background: theme.surfaceColor, borderColor: theme.cardBorderColor }}>
                {content}
              </Link>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12"
          style={{ background: `linear-gradient(to right, transparent, ${theme.backgroundColor})` }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}


