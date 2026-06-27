"use client";

import { useCallback, useEffect, useState } from "react";

export function usePhysicalOverview() {
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/fisicos/overview", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao carregar painel fisico");
      setOverview(payload.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar painel fisico");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { overview, loading, error, reload };
}
