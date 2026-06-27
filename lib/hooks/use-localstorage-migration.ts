"use client";

import { useEffect, useRef } from "react";

const STORE_CONFIG_KEY = "pikbio-store-config";
const STORE_THEME_KEY = "pikbio-store-theme-config";
const MIGRATED_KEY = "pikbio-migrated-v1";

export function useLocalStorageMigration(userId: string | null) {
  const ran = useRef(false);

  useEffect(() => {
    if (!userId || ran.current) return;
    ran.current = true;

    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
    if (alreadyMigrated) return;

    const rawConfig = localStorage.getItem(STORE_CONFIG_KEY);
    const rawTheme = localStorage.getItem(STORE_THEME_KEY);

    if (!rawConfig && !rawTheme) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }

    let config: Record<string, unknown> | null = null;
    let theme: Record<string, unknown> | null = null;

    try {
      config = JSON.parse(rawConfig ?? "null");
    } catch {
      config = null;
    }

    try {
      theme = JSON.parse(rawTheme ?? "null");
    } catch {
      theme = null;
    }

    if (!config && !theme) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }

    fetch("/api/creators/me/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, theme }),
    })
      .then((res) => {
        if (res.ok) {
          localStorage.removeItem(STORE_CONFIG_KEY);
          localStorage.removeItem(STORE_THEME_KEY);
          localStorage.setItem(MIGRATED_KEY, "1");
        }
      })
      .catch(() => {
        ran.current = false;
      });
  }, [userId]);
}

