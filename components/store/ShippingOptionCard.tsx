"use client";

import { Clock, Truck } from "lucide-react";
import Card from "@/components/ui/Card";
import type { StoreShippingOption } from "@/components/store/shipping-types";
import { formatPrice } from "@/lib/utils";

export default function ShippingOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: StoreShippingOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="block w-full text-left">
      <Card className={`p-4 transition ${selected ? "border-[#FF4D6D] bg-[#FF4D6D]/10" : "hover:border-[#FF4D6D]/50"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FF4D6D]/10 text-[#FF4D6D]">
              <Truck size={19} />
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)]">{option.name}</p>
              {option.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{option.description}</p>}
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#F59E0B]">
                <Clock size={13} />
                {option.days} dias úteis
              </p>
            </div>
          </div>
          <p className="shrink-0 font-heading text-lg font-extrabold text-[var(--text-primary)]">{formatPrice(option.price)}</p>
        </div>
      </Card>
    </button>
  );
}
