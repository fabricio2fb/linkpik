"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, Download, Eye, MousePointerClick, ShoppingBag, Smartphone, Sparkles, Store, Zap } from "lucide-react";
import { useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import StorePage from "@/components/store/StorePage";
import ProductPage from "@/components/store/ProductPage";
import { landingCreator, landingProducts } from "@/components/landing/landing-content";
import { THEME_PRESETS } from "@/lib/theme-presets";
import type { Product, TemplateId } from "@/lib/types";

const themes: { id: TemplateId; label: string; gradient: string[] }[] = [
  { id: "minimal", label: "Minimal", gradient: ["#1a1a2e", "#16213e"] },
  { id: "cards", label: "Cards", gradient: ["#0f0f0f", "#1a1a1a"] },
  { id: "glass", label: "Glass", gradient: ["#0f0f1a", "#1a0f2e"] },
  { id: "bold", label: "Bold", gradient: ["#000000", "#1a0000"] },
  { id: "magazine", label: "Magazine", gradient: ["#f5f0e8", "#e8e0d0"] },
  { id: "retro", label: "Retro", gradient: ["#f4e4c1", "#e8d4a8"] },
  { id: "soft", label: "Soft", gradient: ["#f0e6e6", "#e6e0f0"] },
  { id: "cleanpro", label: "Clean Pro", gradient: ["#ffffff", "#f8f8f8"] },
];

const demoSteps = [
  { icon: MousePointerClick, title: "Cliente descobre", text: "Pelo link na bio do Instagram, o cliente abre sua loja personalizada." },
  { icon: Eye, title: "Navega e escolhe", text: "Vê os produtos com capa, preço e descrição. Clica para saber mais." },
  { icon: ShoppingBag, title: "Adiciona e paga", text: "Abre o checkout na hora. Escolhe PIX, cartão ou boleto." },
  { icon: Download, title: "Recebe o acesso", text: "Pagamento confirmado. O link chega no e-mail automaticamente." },
];

export default function DemoPage() {
  const [selectedTheme, setSelectedTheme] = useState<TemplateId>("cards");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const theme = THEME_PRESETS[selectedTheme];

  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <section className="relative overflow-hidden bg-[#0A0A0A] px-5 pt-40 pb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Demonstração</p>
          <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
            Veja a loja funcionando
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
            Navegue pela loja de exemplo como se fosse um comprador. Escolha um tema e explore.
          </p>
        </div>
      </section>

      <section className="bg-[#0A0A0A] px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTheme(t.id)}
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  selectedTheme === t.id
                    ? "border-[#FF4D6D] bg-[#FF4D6D] text-white"
                    : "border-white/[0.08] bg-white/[0.035] text-white/48 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-center space-y-6">
              <div className="rounded-[28px] border border-white/[0.08] bg-[#0f0f0f]/90 p-6">
                <h3 className="font-heading text-lg font-black tracking-[-0.03em] text-white">
                  Sobre este tema
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/52">
                  O tema <strong className="text-white">{selectedTheme === "cleanpro" ? "Clean Pro" : selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}</strong> é
                  ideal para{" "}
                  {selectedTheme === "minimal" && "criadores com poucos produtos que priorizam uma experiência limpa e direta."}
                  {selectedTheme === "cards" && "lojas com 2 ou mais produtos que querem um grid visual e comercial."}
                  {selectedTheme === "glass" && "marcas que buscam um visual premium e sofisticado com efeito translúcido."}
                  {selectedTheme === "bold" && "criadores com identidade forte, streetwear e alto contraste."}
                  {selectedTheme === "magazine" && "conteúdo editorial com ritmo de leitura e estética refinada."}
                  {selectedTheme === "retro" && "produtos criativos com personalidade e cores nostálgicas."}
                  {selectedTheme === "soft" && "bem-estar, mentorias e comunidades com um tom acolhedor."}
                  {selectedTheme === "cleanpro" && "consultores e serviços B2B que buscam profissionalismo."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/90 p-4 text-center">
                  <p className="text-2xl font-black text-white">{landingProducts.length}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-white/34">Produtos</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/90 p-4 text-center">
                  <p className="text-2xl font-black text-white">4/4</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-white/34">Links ativos</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/90 p-4 text-center">
                  <p className="text-2xl font-black text-white">Online</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-white/34">Status</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/registro"
                  className="group inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[#FF4D6D] px-6 text-sm font-black text-white shadow-[0_20px_60px_rgba(255,77,109,0.25)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]"
                >
                  Criar minha loja
                  <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={16} />
                </Link>
                <Link
                  href="/como-funciona"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                >
                  Como funciona
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative mx-auto w-[318px] rounded-[2.6rem] border border-white/15 bg-[linear-gradient(145deg,#2A2A2A,#080808)] p-3 shadow-[0_60px_140px_rgba(0,0,0,0.78),0_0_120px_rgba(255,77,109,0.16)] sm:w-[370px]">
                <div className="absolute left-1/2 top-3 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black" />
                <div className="overflow-hidden rounded-[1.9rem] bg-[#080808]">
                  <div className="flex h-9 items-center justify-between bg-black px-6 text-[10px] font-black text-white/45">
                    <span>9:41</span>
                    <span>Pikbio</span>
                    <span>5G</span>
                  </div>
                  <div className="scrollbar-hidden h-[600px] overflow-y-auto">
                    {selectedProduct ? (
                      <ProductPage
                        creator={{ ...landingCreator, coverImage: null }}
                        product={selectedProduct}
                        otherProducts={landingProducts.filter((item) => item.id !== selectedProduct.id)}
                        theme={theme}
                        embedded
                        embeddedCheckout
                        onBack={() => setSelectedProduct(null)}
                        onProductChange={setSelectedProduct}
                      />
                    ) : (
                      <StorePage
                        creator={{
                          ...landingCreator,
                          coverImage: null,
                        }}
                        products={landingProducts}
                        theme={theme}
                        embedded
                        previewMode
                        onProductClick={setSelectedProduct}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#070707] px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Fluxo do comprador</p>
          <h2 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
            Da descoberta ao acesso
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
            O caminho que o cliente percorre do clique na bio até receber o produto.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {demoSteps.map((step, index) => (
            <div key={step.title} className="rounded-[28px] border border-white/[0.08] bg-[#0f0f0f]/90 p-6 transition hover:-translate-y-1 hover:border-white/20">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">
                <step.icon size={18} />
              </span>
              <span className="mt-4 block text-[10px] font-black uppercase tracking-[0.14em] text-[#FF4D6D]">Etapa {index + 1}</span>
              <h3 className="mt-1 font-heading text-base font-black tracking-[-0.03em] text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/52">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4D6D]/10 blur-[130px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Próxima ação</p>
          <h2 className="mt-4 font-heading text-5xl font-black leading-tight tracking-[-0.075em] text-white md:text-6xl">
            Sua loja pode ser a próxima.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/52">Crie sua conta gratuita e monte sua loja em 5 minutos.</p>
          <Link href="/registro" className="mt-9 inline-flex h-14 items-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_24px_80px_rgba(255,77,109,0.35)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]">
            Criar minha loja grátis
            <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
