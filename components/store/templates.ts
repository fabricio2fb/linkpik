import type { TemplateId } from "@/lib/types";
import { THEME_PRESETS, themePresetIds } from "@/lib/theme-presets";
import { fontVars } from "@/lib/theme";

export const storeTemplates = Object.fromEntries(
  themePresetIds.map((id) => {
    const preset = THEME_PRESETS[id];
    return [
      id,
      {
        name: id === "cleanpro" ? "Clean Pro" : id.charAt(0).toUpperCase() + id.slice(1),
        description: `${preset.fontHeading}, ${preset.storeLayout}, ${preset.cardLayout}`,
        defaultAccent: preset.accentColor,
        supportsTheme: true,
        titleFont: fontVars[preset.fontHeading],
        bodyFont: fontVars[preset.fontBody],
        pageBg: {
          dark: preset.backgroundColor,
          light: preset.themeMode === "light" ? preset.backgroundColor : "#ffffff",
        },
      },
    ];
  }),
) as Record<
  TemplateId,
  {
    name: string;
    description: string;
    defaultAccent: string;
    supportsTheme: boolean;
    titleFont: string;
    bodyFont: string;
    pageBg: { dark: string; light: string };
  }
>;

export const templateIds = themePresetIds;

