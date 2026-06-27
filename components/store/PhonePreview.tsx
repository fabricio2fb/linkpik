"use client";

import { useState } from "react";
import StorePage from "@/components/store/StorePage";
import ProductPage from "@/components/store/ProductPage";
import type { Creator, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";

type PhonePreviewProps = {
  creator: Creator;
  products: Product[];
  theme: StoreTheme;
};

export default function PhonePreview({
  creator,
  products,
  theme,
}: PhonePreviewProps) {
  const [view, setView] = useState<"store" | "product">("store");
  const visibleProducts = products
    .filter((product) => (product.status ?? "active") === "active")
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const firstProduct = visibleProducts[0];

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-heading text-lg font-bold text-[var(--text-primary)]">Preview ao vivo</p>
        <div className="grid grid-cols-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs font-bold">
          <button type="button" onClick={() => setView("store")} className={`rounded-full px-3 py-1.5 ${view === "store" ? "bg-[#FF4D6D] text-white" : "text-[var(--text-secondary)]"}`}>
            Loja
          </button>
          <button type="button" onClick={() => setView("product")} className={`rounded-full px-3 py-1.5 ${view === "product" ? "bg-[#FF4D6D] text-white" : "text-[var(--text-secondary)]"}`}>
            Produto
          </button>
        </div>
      </div>
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-[5px] shadow-lg">
        <div className="overflow-hidden rounded-[1.55rem] border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="relative h-7 bg-[var(--bg-surface)]">
            <div className="absolute left-1/2 top-1.5 h-3.5 w-20 -translate-x-1/2 rounded-full bg-[var(--bg-elevated)]" />
            <div className="flex h-full items-center justify-between px-5 text-[10px] font-bold text-[var(--text-secondary)]">
              <span>9:41</span>
              <span>5G 100%</span>
            </div>
          </div>
          <div className="h-[720px] overflow-y-auto store-scrollbar">
            {view === "store" || !firstProduct ? (
              <StorePage
                creator={{ ...creator, theme }}
                products={visibleProducts}
                theme={theme}
                previewMode
                embedded
              />
            ) : (
              <ProductPage
                creator={{ ...creator, theme }}
                product={firstProduct}
                otherProducts={visibleProducts.slice(1)}
                theme={theme}
                embedded
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

