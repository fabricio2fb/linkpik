"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, Clock, MapPin, Package, Ruler, Scale, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PhysicalCheckoutSteps from "@/components/store/PhysicalCheckoutSteps";
import ShippingCalculator from "@/components/store/ShippingCalculator";
import type { StoreShippingOption } from "@/components/store/shipping-types";
import { physicalDemoProduct, physicalDemoShippingOptions } from "@/app/demo/physical-demo-data";
import { formatPrice } from "@/lib/utils";

export default function DemoProdutoFisicoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const demoShippingOptions: StoreShippingOption[] = physicalDemoShippingOptions.map((option) => ({ id: option.id, name: option.name, description: option.description, price: option.price, days: option.days }));
  const [shipping, setShipping] = useState<StoreShippingOption | null>(null);
  const total = useMemo(() => physicalDemoProduct.price + (shipping?.price ?? 0), [shipping]);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 text-[var(--text-primary)]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <Card className="overflow-hidden">
            <div className="grid min-h-[320px] place-items-center bg-gradient-to-br from-[#052e16] to-[#166534] p-8 text-center">
              <div className="grid size-24 place-items-center rounded-[24px] bg-white/10 text-white">
                <ShoppingBag size={44} />
              </div>
              <div>
                <Badge tone="success">Produto físico</Badge>
                <h1 className="mt-4 font-heading text-4xl font-extrabold text-white">{physicalDemoProduct.name}</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">{physicalDemoProduct.description}</p>
              </div>
            </div>
            <div className="grid gap-5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Estoque disponível: {physicalDemoProduct.stock} unidades</p>
                  <p className="mt-1 font-heading text-3xl font-extrabold text-[#FF4D6D]">{formatPrice(physicalDemoProduct.price)}</p>
                </div>
                <Link href="#checkout">
                  <Button className="w-full sm:w-auto">Comprar produto físico</Button>
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Spec icon={Scale} label="Peso" value={physicalDemoProduct.weight} />
                <Spec icon={Ruler} label="Medidas" value={`${physicalDemoProduct.width} x ${physicalDemoProduct.height} x ${physicalDemoProduct.length}`} />
                <Spec icon={MapPin} label="CEP origem" value={physicalDemoProduct.originPostalCode} />
                <Spec icon={Clock} label="Preparo" value={physicalDemoProduct.preparationTime} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                <CheckCircle size={20} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">O que vem no pedido</h2>
                <div className="mt-4 grid gap-2">
                  {physicalDemoProduct.includes.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle size={16} className="text-[#22C55E]" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <ShippingCalculator productId={physicalDemoProduct.id} selected={shipping} onSelect={setShipping} />
        </section>

        <aside id="checkout" className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#FF4D6D]/10 text-[#FF4D6D]">
                <Package size={19} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Resumo</h2>
                <p className="text-sm text-[var(--text-secondary)]">Produto + frete selecionado.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <Row label="Produto" value={formatPrice(physicalDemoProduct.price)} />
              <Row label={shipping ? `Frete ${shipping.name}` : "Frete"} value={shipping ? formatPrice(shipping.price) : "Calcule o CEP"} />
              <div className="border-t border-[var(--border-subtle)] pt-3">
                <Row label="Total" value={formatPrice(total)} strong />
              </div>
            </div>
          </Card>

          <PhysicalCheckoutSteps productPrice={physicalDemoProduct.price} buyerName="Mariana Souza" trackingCode="PKB123456789BR" shippingOptions={demoShippingOptions} />
        </aside>
      </div>
    </main>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <Icon size={18} className="text-[#FF4D6D]" />
      <p className="mt-2 text-xs font-bold uppercase text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-heading text-xl font-extrabold" : ""}`}>
      <span className={strong ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>{label}</span>
      <span className={strong ? "text-[#22C55E]" : "font-bold text-[var(--text-primary)]"}>{value}</span>
    </div>
  );
}
