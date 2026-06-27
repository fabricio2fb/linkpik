"use client";

import { Calculator, MapPin, PackageCheck, Route, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type ShippingQuote = { id: string; method: string; carrier: string; priceCents: number; deadlineDays: number };

export default function FreteRastreioPage() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [productId, setProductId] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/fisicos/frete", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => setSettings(payload.data ?? null))
      .catch(() => setSettings(null));
  }, []);

  async function simulate() {
    setError("");
    setQuotes([]);
    if (!productId || zipcode.replace(/\D/g, "").length !== 8) {
      setError("Informe um produto fisico e um CEP valido para simular.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, destination_zipcode: zipcode.replace(/\D/g, "") }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Nao foi possivel simular o frete.");
        return;
      }
      setQuotes(payload.data.quotes ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">Frete e rastreio</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">Configure origem e estimativas de frete. No MVP, o criador confere o frete e realiza a postagem por conta propria.</p>
      </header>
      <section className="grid gap-4 xl:grid-cols-4">
        <ConfigCard icon={MapPin} title="Origem dos envios" lines={[settings?.origin?.zipcode ? `CEP ${settings.origin.zipcode}` : "Nenhuma origem configurada", `Preparo em ${settings?.origin?.preparation_days ?? 2} dias uteis`]} action="Editar origem" />
        <ConfigCard icon={Truck} title="Frete manual" lines={["O criador define ou confere o frete", "Postagem feita pelo proprio criador", "Rastreio informado manualmente"]} />
        <ConfigCard icon={Calculator} title="Melhor Envio em breve" lines={settings?.future_integrations ?? ["Calculo real de frete", "Etiquetas automaticas", "Rastreio automatico"]} />
        <ConfigCard icon={PackageCheck} title="Regras do MVP" lines={["Cotacao interna estimada", "Sem etiqueta automatica", "Cliente acompanha por link seguro"]} />
      </section>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Calculator className="text-[#FF4D6D]" />
          <div>
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Simulador de frete interno</h2>
            <p className="text-sm text-[var(--text-secondary)]">Informe o ID de um produto fisico cadastrado. A cotacao e uma estimativa interna para o MVP.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="ID do produto fisico" value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="UUID do produto" />
          <Input label="CEP destino" value={zipcode} onChange={(event) => setZipcode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="24000000" />
        </div>
        <Button className="mt-5" loading={loading} onClick={simulate}>Simular frete</Button>
        {error && <p className="mt-4 text-sm font-bold text-red-400">{error}</p>}
        {quotes.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {quotes.map((option) => (
              <div key={option.id} className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[var(--text-primary)]">{option.method}</p>
                  <Badge tone="success">API interna</Badge>
                </div>
                <p className="mt-3 font-heading text-2xl font-extrabold text-[#FF4D6D]">R$ {(option.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{option.deadlineDays} dias uteis</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ConfigCard({ icon: Icon, title, lines, action }: { icon: typeof Route; title: string; lines: string[]; action?: string }) {
  return (
    <Card className="p-5">
      <Icon size={22} className="text-[#FF4D6D]" />
      <h2 className="mt-3 font-heading text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <div className="mt-3 grid gap-2">
        {(lines.length ? lines : ["Nao configurado"]).map((line) => <p key={line} className="text-sm text-[var(--text-secondary)]">{line}</p>)}
      </div>
      {action && <Button variant="secondary" className="mt-4 h-9">{action}</Button>}
    </Card>
  );
}
