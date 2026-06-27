"use client";

import Image from "next/image";
import { Check, HelpCircle, MessageCircle, Star } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { buildDefaultProductPageSections, type ProductPageSection } from "@/lib/product-page-sections";
import type { Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { buttonHeightPx, buttonRadiusPx, fontVars, radiusPx } from "@/lib/theme";
import { formatPrice, getInitials } from "@/lib/utils";

type ProductPageSectionsProps = {
  product: Product;
  theme: StoreTheme;
  sections?: ProductPageSection[];
  onBuy: () => void;
  className?: string;
  compact?: boolean;
  editable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onInlineChange?: (section: ProductPageSection) => void;
};

export default function ProductPageSections({
  product,
  theme,
  sections,
  onBuy,
  className = "",
  compact = false,
  editable = false,
  selectedSectionId,
  onSelectSection,
  onInlineChange,
}: ProductPageSectionsProps) {
  const visibleSections = sections?.length ? sections : buildDefaultProductPageSections(product);
  const sectionStyle: CSSProperties = {
    background: theme.surfaceColor,
    borderColor: theme.cardBorderColor,
    borderRadius: radiusPx[theme.cardBorderRadius],
    color: theme.textPrimaryColor,
  };
  const buttonStyle = buildButtonStyle(theme, "primary");

  return (
    <div id="product-page-sections" className={`grid gap-5 ${compact ? "" : "px-5 py-6 lg:px-0 lg:py-0"} ${className}`}>
      {visibleSections.map((section) => {
        const selectableProps = editable
          ? {
              onClick: (event: MouseEvent<HTMLElement>) => {
                event.stopPropagation();
                onSelectSection?.(section.id);
              },
            }
          : {};
        const sectionClass = (base = "") => editable ? editableSectionClass(selectedSectionId === section.id, base) : base;
        const selectedClass = sectionClass();
        switch (section.type) {
          case "heading":
            return (
              <section key={section.id} {...selectableProps} className={selectedClass}>
                <h1
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onInput={(event) => {
                    if (!editable) return;
                    onInlineChange?.({ ...section, data: { ...section.data, text: sanitizeInlineText(event.currentTarget.textContent ?? "") } });
                  }}
                  className={`font-heading font-extrabold leading-tight ${section.data.size === "large" ? "text-3xl lg:text-4xl" : "text-2xl"}`}
                  style={{ fontFamily: fontVars[theme.fontHeading] }}
                >
                  {section.data.text}
                </h1>
              </section>
            );
          case "paragraph":
            return (
              <section key={section.id} {...selectableProps} className={selectedClass} style={{ color: theme.textSecondaryColor }}>
                <div
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onInput={(event) => {
                    if (!editable) return;
                    onInlineChange?.({ ...section, data: { content: sanitizeDisplayHtml(event.currentTarget.innerHTML) } });
                  }}
                  className="product-rich-text max-w-none break-words text-sm leading-7 [overflow-wrap:anywhere]"
                  dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(section.data.content) }}
                />
              </section>
            );
          case "quote":
            return (
              <section key={section.id} {...selectableProps} className={selectedClass} style={{ borderColor: theme.accentColor, color: theme.textPrimaryColor }}>
                <div
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onInput={(event) => {
                    if (!editable) return;
                    onInlineChange?.({ ...section, data: { text: sanitizeDisplayHtml(event.currentTarget.innerHTML) } });
                  }}
                  className="border-l-4 py-2 pl-4 text-lg font-semibold leading-8"
                  style={{ borderColor: theme.accentColor }}
                  dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(section.data.text) }}
                />
              </section>
            );
          case "checklist":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("rounded-2xl border p-5")} style={sectionStyle}>
                <h2 className="font-heading text-lg font-bold">O que esta incluido</h2>
                <div className="mt-4 grid gap-2.5">
                  {section.data.items.filter(Boolean).map((item) => (
                    <div key={item} className="flex gap-3 text-sm">
                      <Check size={18} className="shrink-0" style={{ color: theme.accentColor }} />
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]" style={{ color: theme.textSecondaryColor }}>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          case "faq":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("rounded-2xl border p-5")} style={sectionStyle}>
                <h2 className="font-heading text-lg font-bold">Duvidas frequentes</h2>
                <div className="mt-4 divide-y" style={{ borderColor: theme.cardBorderColor }}>
                  {section.data.items.map((item, index) => (
                    <details key={`${item.question}-${index}`} className="group py-4 first:pt-0 last:pb-0">
                      <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-bold">
                        <HelpCircle size={16} style={{ color: theme.accentColor }} />
                        <span className="flex-1">{item.question}</span>
                      </summary>
                      <div className="mt-3 pl-7 text-sm leading-6" style={{ color: theme.textSecondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(item.answer) }} />
                    </details>
                  ))}
                </div>
              </section>
            );
          case "image":
            return section.data.url ? <section key={section.id} {...selectableProps} className={selectedClass}><ProductImage url={section.data.url} /></section> : null;
          case "image_text":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass(`grid gap-5 rounded-2xl border p-4 md:grid-cols-2 md:items-center ${section.data.side === "right" ? "md:[&>*:first-child]:order-2" : ""}`)} style={sectionStyle}>
                {section.data.url ? <ProductImage url={section.data.url} plain /> : <div className="aspect-video rounded-xl border border-dashed" style={{ borderColor: theme.cardBorderColor }} />}
                <div>
                  <h2 className="font-heading text-xl font-bold">{section.data.heading}</h2>
                  <div className="mt-3 text-sm leading-7" style={{ color: theme.textSecondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(section.data.text) }} />
                </div>
              </section>
            );
          case "video":
            return section.data.url ? (
              <section key={section.id} {...selectableProps} className={sectionClass("overflow-hidden rounded-2xl border")} style={sectionStyle}>
                <iframe src={toEmbedUrl(section.data.url)} title="Video do produto" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </section>
            ) : null;
          case "gallery":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("grid gap-3 sm:grid-cols-2")}>
                {section.data.images.filter(Boolean).map((url) => <ProductImage key={url} url={url} plain />)}
              </section>
            );
          case "testimonials":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("grid gap-3 sm:grid-cols-2")}>
                {section.data.items.map((item, index) => (
                  <article key={`${item.name}-${index}`} className="rounded-2xl border p-5" style={sectionStyle}>
                    <div className="flex items-center gap-3">
                      <div className="relative grid size-10 place-items-center overflow-hidden rounded-full text-xs font-bold text-white" style={{ background: theme.accentColor }}>
                        {item.avatar_url ? <Image src={item.avatar_url} alt="" fill sizes="40px" className="object-cover" unoptimized /> : getInitials(item.name)}
                      </div>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <div className="mt-1 flex" style={{ color: theme.accentColor }}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={12} fill="currentColor" />)}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-6" style={{ color: theme.textSecondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(item.text) }} />
                  </article>
                ))}
              </section>
            );
          case "stats":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("grid gap-3 sm:grid-cols-3")}>
                {section.data.items.map((item, index) => (
                  <div key={`${item.value}-${index}`} className="rounded-2xl border p-5 text-center" style={sectionStyle}>
                    <p className="text-3xl font-extrabold" style={{ color: theme.accentColor }}>{item.value}</p>
                    <p className="mt-2 text-sm" style={{ color: theme.textSecondaryColor }}>{item.label}</p>
                  </div>
                ))}
              </section>
            );
          case "table":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("overflow-x-auto rounded-2xl border")} style={sectionStyle}>
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead style={{ background: `${theme.accentColor}12` }}>
                    <tr>{section.data.headers.map((header) => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.cardBorderColor }}>
                    {section.data.rows.map((row, index) => (
                      <tr key={index}>{section.data.headers.map((_, cellIndex) => <td key={cellIndex} className="px-4 py-3" style={{ color: theme.textSecondaryColor }}>{row[cellIndex] ?? ""}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          case "divider":
            return <section key={section.id} {...selectableProps} className={selectedClass}><hr className="border-0 border-t" style={{ borderColor: theme.cardBorderColor }} /></section>;
          case "spacer":
            return <section key={section.id} {...selectableProps} className={selectedClass}><div className={section.data.size === "large" ? "h-12" : section.data.size === "medium" ? "h-8" : "h-4"} /></section>;
          case "columns":
            return (
              <section key={section.id} {...selectableProps} className={sectionClass("grid gap-3 sm:grid-cols-2")}>
                {section.data.items.map((item, index) => (
                  <article key={`${item.title}-${index}`} className="rounded-2xl border p-5" style={sectionStyle}>
                    <div className="grid size-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: theme.accentColor }}>{iconLabel(item.icon)}</div>
                    <h3 className="mt-4 font-heading text-lg font-bold">{item.title}</h3>
                    <div className="mt-2 text-sm leading-6" style={{ color: theme.textSecondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeDisplayHtml(item.text) }} />
                  </article>
                ))}
              </section>
            );
          case "cta_button":
            return (
              <section key={section.id} {...selectableProps} className={selectedClass}>
                <a
                  href={section.data.url || "#product-page-sections"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-center text-sm font-bold transition hover:-translate-y-px"
                  style={buildButtonStyle(theme, section.data.style)}
                >
                  <MessageCircle size={16} />
                  {section.data.label}
                </a>
              </section>
            );
          case "buy_button":
            return (
              <section key={section.id} {...selectableProps} className={selectedClass}>
                <button type="button" onClick={onBuy} className="w-full px-5 text-base transition hover:-translate-y-px" style={buttonStyle}>
                  Comprar agora - {formatPrice(product.price)}
                </button>
              </section>
            );
        }
      })}
    </div>
  );
}

function buildButtonStyle(theme: StoreTheme, style: "primary" | "secondary"): CSSProperties {
  const filled = style === "primary";
  return {
    minHeight: buttonHeightPx[theme.buttonSize],
    borderRadius: buttonRadiusPx[theme.buttonRadius],
    fontWeight: theme.buttonWeight,
    textTransform: theme.buttonTransform,
    border: filled ? "none" : `1px solid ${theme.cardBorderColor}`,
    background: filled ? theme.accentColor : "transparent",
    color: filled ? theme.buttonTextColor : theme.accentColor,
    textDecoration: "none",
  };
}

function ProductImage({ url, plain = false }: { url: string; plain?: boolean }) {
  return (
    <div className={`relative overflow-hidden ${plain ? "rounded-xl" : "rounded-2xl"}`} style={{ aspectRatio: "16 / 9" }}>
      <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" unoptimized />
    </div>
  );
}

function sanitizeDisplayHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function sanitizeInlineText(value: string) {
  return value.replace(/[<>]/g, "").trimStart();
}

function editableSectionClass(selected: boolean, base = "") {
  const editableBase = "relative transition outline-none";
  const editableHover = "hover:ring-2 hover:ring-[#FF4D6D]/30";
  const editableSelected = selected ? "ring-2 ring-[#FF4D6D] ring-offset-2 ring-offset-transparent" : "";
  return [base, editableBase, editableHover, editableSelected].filter(Boolean).join(" ");
}

function toEmbedUrl(url: string) {
  if (url.includes("youtube.com/watch?v=")) return url.replace("watch?v=", "embed/");
  if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/");
  return url;
}

function iconLabel(icon: string) {
  const normalized = icon.trim().toLowerCase();
  if (normalized === "star") return "★";
  if (normalized === "check") return "✓";
  if (normalized === "bolt") return "!";
  return normalized.slice(0, 2).toUpperCase() || "✓";
}
