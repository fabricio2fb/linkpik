"use client";

import { MapPin, Truck } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import ShippingOptionCard from "./ShippingOptionCard";
import type { StoreShippingOption } from "@/components/store/shipping-types";

export default function ShippingCalculator({
  productId,
  selected,
  onSelect,
}: {
  productId: string;
  selected: StoreShippingOption | null;
  onSelect: (option: StoreShippingOption) => void;
}) {
  const [postalCode, setPostalCode] = useState("");
  const [options, setOptions] = useState<StoreShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    setError("");
    setOptions([]);
    const destination = postalCode.replace(/\D/g, "");
    if (destination.length !== 8) {
      setError("Informe um CEP valido.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, destination_zipcode: destination }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Nao foi possivel calcular o frete.");
        return;
      }
      setOptions((payload.data.quotes ?? []).map((quote: Record<string, unknown>) => ({
        id: String(quote.id),
        name: String(quote.method),
        description: String(quote.carrier ?? ""),
        price: Number(quote.priceCents ?? 0) / 100,
        days: Number(quote.deadlineDays ?? 0),
      })));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-[#FF4D6D]/10 text-[#FF4D6D]">
          <Truck size={19} />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Entrega</h2>
          <p className="text-sm text-[var(--text-secondary)]">Calcule o frete pela API interna do Pikbio.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input label="CEP" value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/[^\d-]/g, "").slice(0, 9))} placeholder="00000-000" suffix={<MapPin size={16} />} />
        <div className="flex items-end">
          <Button className="w-full sm:w-auto" loading={loading} onClick={calculate}>Calcular frete</Button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-bold text-red-400">{error}</p>}
      {options.length > 0 && (
        <div className="mt-5 grid gap-3">
          {options.map((option) => (
            <ShippingOptionCard key={option.id} option={option} selected={selected?.id === option.id} onSelect={() => onSelect(option)} />
          ))}
        </div>
      )}
    </Card>
  );
}
