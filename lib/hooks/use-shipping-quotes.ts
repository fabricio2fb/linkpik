"use client";

import { useState } from "react";

export function useShippingQuotes(productId: string) {
  const [quotes, setQuotes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function quote(destinationZipcode: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, destination_zipcode: destinationZipcode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao calcular frete");
      setQuotes(payload.data.quotes ?? []);
      return payload.data.quotes ?? [];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao calcular frete");
      return [];
    } finally {
      setLoading(false);
    }
  }

  return { quotes, loading, error, quote };
}
