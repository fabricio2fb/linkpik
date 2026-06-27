"use client";

import Link from "next/link";
import { CheckCircle, CreditCard, MapPin, Package, User } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";
import ShippingOptionCard from "./ShippingOptionCard";
import type { StoreShippingOption } from "@/components/store/shipping-types";

type Step = 0 | 1 | 2 | 3 | 4;

const steps = [
  { label: "Comprador", icon: User },
  { label: "Endereco", icon: MapPin },
  { label: "Frete", icon: Package },
  { label: "Resumo", icon: CreditCard },
];

export default function PhysicalCheckoutSteps({
  productPrice,
  buyerName,
  trackingCode,
  shippingOptions,
}: {
  productPrice: number;
  buyerName: string;
  trackingCode: string;
  shippingOptions: StoreShippingOption[];
}) {
  const [step, setStep] = useState<Step>(0);
  const [shipping, setShipping] = useState<StoreShippingOption>(shippingOptions[0]);
  const total = useMemo(() => productPrice + (shipping?.price ?? 0), [productPrice, shipping]);

  if (step === 4) {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">
          <CheckCircle size={34} />
        </div>
        <h2 className="mt-5 font-heading text-2xl font-extrabold text-[var(--text-primary)]">Pagamento aprovado</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Pedido fisico criado para demonstracao visual.</p>
        <div className="mx-auto mt-5 max-w-sm rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <p className="text-xs font-bold uppercase text-[var(--text-tertiary)]">Codigo de rastreio</p>
          <p className="mt-1 font-heading text-xl font-extrabold text-[var(--text-primary)]">{trackingCode}</p>
        </div>
        <Link href="/demo/rastreio">
          <Button className="mt-5 w-full sm:w-auto">Ver rastreamento</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = step === index;
          const done = step > index;
          return (
            <div key={item.label} className="grid justify-items-center gap-2 text-center">
              <div className={`grid size-10 place-items-center rounded-full ${done ? "bg-[#22C55E] text-white" : active ? "bg-[#FF4D6D] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}>
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        {step === 0 && <div className="grid gap-4"><Input label="Nome completo" defaultValue={buyerName} /><Input label="Email" defaultValue="cliente@email.com" /><Input label="CPF" defaultValue="12345678900" /></div>}
        {step === 1 && <div className="grid gap-4 md:grid-cols-2"><Input label="CEP" defaultValue="24000000" /><Input label="Rua" defaultValue="Rua cadastrada" /><Input label="Numero" defaultValue="123" /><Input label="Bairro" defaultValue="Centro" /><Input label="Cidade" defaultValue="Cidade" /><Input label="Estado" defaultValue="UF" /></div>}
        {step === 2 && <div className="grid gap-3">{shippingOptions.map((option) => <ShippingOptionCard key={option.id} option={option} selected={shipping?.id === option.id} onSelect={() => setShipping(option)} />)}</div>}
        {step === 3 && (
          <div className="grid gap-4">
            <SummaryRow label="Produto" value={formatPrice(productPrice)} />
            <SummaryRow label={`Frete ${shipping?.name ?? ""}`} value={formatPrice(shipping?.price ?? 0)} />
            <div className="border-t border-[var(--border-subtle)] pt-4"><SummaryRow label="Total" value={formatPrice(total)} strong /></div>
            <Button className="w-full" onClick={() => setStep(4)}>Simular pagamento aprovado</Button>
          </div>
        )}
      </div>
      {step < 3 && <div className="mt-6 flex justify-between gap-3"><Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1) as Step)}>Voltar</Button><Button onClick={() => setStep((current) => Math.min(3, current + 1) as Step)}>Continuar</Button></div>}
      {step === 3 && <div className="mt-6"><Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button></div>}
    </Card>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-heading text-xl font-extrabold text-[var(--text-primary)]" : "text-sm text-[var(--text-secondary)]"}`}>
      <span>{label}</span>
      <span className={strong ? "text-[#22C55E]" : "font-bold text-[var(--text-primary)]"}>{value}</span>
    </div>
  );
}
