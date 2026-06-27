"use client";

import { useCallback, useEffect, useState } from "react";

export function useInventory() {
  const [products, setProducts] = useState<unknown[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/fisicos/estoque", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao carregar estoque");
      setProducts(payload.data.products ?? []);
      setSummary(payload.data.summary ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, summary, loading, error, reload };
}
