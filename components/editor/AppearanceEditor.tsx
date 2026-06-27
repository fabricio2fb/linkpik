"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import PhonePreview from "@/components/store/PhonePreview";
import ThemeEditor from "@/components/editor/ThemeEditor";
import type { Creator, Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme-presets";

type AppearanceEditorProps = {
  creator: Creator;
  products: Product[];
  onCreatorChange: (creator: Creator) => void;
  onToast?: (message: string) => void;
};

export default function AppearanceEditor({
  creator,
  products,
  onCreatorChange,
  onToast,
}: AppearanceEditorProps) {
  const [theme, setTheme] = useState<StoreTheme>(creator.theme ?? THEME_PRESETS[creator.template ?? "cards"]);

  function updateTheme(nextTheme: StoreTheme) {
    setTheme(nextTheme);
    onCreatorChange({ ...creator, theme: nextTheme, template: nextTheme.template, accentColor: nextTheme.accentColor, avatarColor: nextTheme.accentColor });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <Card className="p-5">
        <ThemeEditor
          creator={creator}
          products={products}
          theme={theme}
          onThemeChange={updateTheme}
          onCreatorChange={onCreatorChange}
          onToast={(message) => onToast?.(message)}
        />
      </Card>
      <div className="hidden xl:block">
        <PhonePreview creator={{ ...creator, theme }} products={products} theme={theme} />
      </div>
    </div>
  );
}

