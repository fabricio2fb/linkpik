import type { Creator, Product } from "./types";
import type { StoreTheme } from "./theme";

export const STORE_CONFIG_KEY = "pikbio-store-config";
export const STORE_THEME_KEY = "pikbio-store-theme-config";

export type StoreConfig = {
  creator: Creator;
  products: Product[];
  theme: StoreTheme;
};

export function readStoreConfig(): StoreConfig | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORE_CONFIG_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoreConfig;
    if (!parsed.creator || !Array.isArray(parsed.products) || !parsed.theme) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoreConfig(config: StoreConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(config));
  window.localStorage.setItem(STORE_THEME_KEY, JSON.stringify(config.theme));
}
