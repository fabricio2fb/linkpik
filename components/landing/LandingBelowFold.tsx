"use client";

import Link from "next/link";
import LandingBlogPreview from "@/components/landing/LandingBlogPreview";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Facebook,
  Instagram,
  MousePointerClick,
  Music2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Wallet,
  Zap,
} from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import StorePage from "@/components/store/StorePage";
import ProductPage from "@/components/store/ProductPage";
import Modal from "@/components/ui/Modal";
import { landingCreator, landingProducts } from "@/components/landing/landing-content";
import { storeTemplates, templateIds } from "@/components/store/templates";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { useInView } from "@/lib/use-in-view";
import type { Product, TemplateId } from "@/lib/types";

function Reveal({ children, delay = "" }: { children: ReactNode; delay?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref);
  return (
    <div ref={ref} className={`animate-fadeUp ${delay} ${visible ? "visible" : ""}`}>
      {children}
    </div>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.055em] text-white md:text-5xl">{title}</h2>
      {text && <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">{text}</p>}
    </div>
  );
}

export default function LandingBelowFold() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("cards");

  const [openFaq, setOpenFaq] = useState(0);
  const [exampleStoreOpen, setExampleStoreOpen] = useState(false);

  return (
    <>
      <section id="produto" className="relative overflow-hidden bg-[#070707] px-5 py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <SectionIntro
          eyebrow="O fluxo"
          title="Tudo que precisa acontecer depois do clique."
          text="A loja, o produto, o pagamento e a entrega ficam no mesmo ambiente. O visitante nao precisa entender sua stack, ele so compra."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-3">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index === 1 ? "delay-100" : index === 2 ? "delay-200" : ""}>
                <div className="group relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#101010] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#FF4D6D]/28">
                  <div className="absolute -right-16 -top-16 size-44 rounded-full bg-[#FF4D6D]/10 blur-3xl transition group-hover:bg-[#FF4D6D]/18" />
                  <div className="relative z-10">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-[#FF4D6D]">
                      <Icon size={24} />
                    </span>
                    <p className="mt-8 font-heading text-6xl font-black tracking-[-0.08em] text-white/[0.08]">{step.number}</p>
                    <h3 className="mt-3 font-heading text-2xl font-black tracking-[-0.04em]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/52">{step.text}</p>
                    <div className="mt-6">{step.visual}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>





      <section id="demo" className="relative overflow-hidden bg-[#0A0A0A] px-5 py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <SectionIntro
          eyebrow="Jornada do cliente"
          title="Do clique na bio ao acesso liberado."
          text="Um caminho simples para o comprador entender, confiar e finalizar a compra."
        />
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExampleStoreOpen(true)}
            className="inline-flex h-13 items-center justify-center rounded-full bg-[#FF4D6D] px-7 text-sm font-black text-white shadow-[0_20px_60px_rgba(255,77,109,0.28)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]"
          >
            Abrir loja no modal
            <Store className="ml-2" size={17} />
          </button>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <div className="relative">
            <div className="absolute left-1/2 top-6 hidden h-[calc(100%-48px)] w-px -translate-x-1/2 bg-gradient-to-b from-[#FF4D6D] via-white/12 to-[#22C55E] lg:block" />
            <div className="grid gap-5">
              {clientJourney.map((step, index) => {
                const Icon = step.icon;
                const left = index % 2 === 0;
                const textCard = (
                  <div className={`${left ? "lg:text-right" : "lg:text-left"} rounded-[28px] border border-white/[0.08] bg-[#111] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.32)] transition duration-300 hover:-translate-y-1 hover:border-[#FF4D6D]/28`}>
                    <div className={`flex items-center gap-3 ${left ? "lg:justify-end" : ""}`}>
                      <span className="grid size-11 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">
                        <Icon size={20} />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/32">{step.label}</p>
                        <h3 className="mt-1 font-heading text-xl font-black tracking-[-0.04em] text-white">{step.title}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/52">{step.text}</p>
                  </div>
                );
                const visualCard = <JourneyVisual type={step.visual} accent={step.accent} />;
                return (
                  <Reveal key={step.title} delay={index === 1 ? "delay-100" : index === 2 ? "delay-200" : ""}>
                    <div className="relative grid gap-4 lg:grid-cols-[1fr_86px_1fr] lg:items-center">
                      {left ? textCard : <div className="hidden lg:block">{visualCard}</div>}
                      <div className="absolute left-5 top-5 grid size-10 place-items-center rounded-full border border-[#FF4D6D]/40 bg-[#0A0A0A] font-heading text-sm font-black text-[#FF8EA2] lg:static lg:mx-auto lg:size-14">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      {left ? <div className="hidden lg:block">{visualCard}</div> : textCard}
                      <div className="lg:hidden">{visualCard}</div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-7xl">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Templates da loja</p>
              <h3 className="mt-3 font-heading text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">Escolha um visual e publique.</h3>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/46">Os mesmos modelos disponíveis no editor da loja, com estilos diferentes para cada tipo de criador.</p>
          </div>

          <div className="group relative mt-8 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--carousel-fade)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--carousel-fade)] to-transparent" />
            <div className="landing-template-track flex w-max gap-4 py-2">
              {[...templateIds, ...templateIds].map((templateId, index) => (
                <TemplateCarouselCard key={`${templateId}-${index}`} templateId={templateId} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="precos" className="bg-[#070707] px-5 py-24">
        <SectionIntro
          eyebrow="Preco"
          title="Comece sem mensalidade. Evolua quando vender mais."
          text="O plano gratis cobre o essencial para validar sua loja. O Pro remove limites, reduz taxa e libera dominio proprio."
        />

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-2">
          <PricingCard
            title="Free"
            eyebrow="Para validar"
            price="R$ 0"
            suffix="/mes"
            description="Sem mensalidade. Pague apenas quando vender."
            features={["Loja na bio", "Ate 5 produtos", "Checkout Mercado Pago", "Upsell basico", "Analytics basico"]}
            missing={["Dominio proprio", "Produtos ilimitados", "Integracoes de pixel", "Remover marca d'agua"]}
            cta="Comecar gratis"
          />
          <PricingCard
            pro
            title="Pro"
            eyebrow="Para escalar"
            price="R$ 29"
            suffix="/mes"
            description="Mensal, sem fidelidade."
            features={["Tudo do Free", "Produtos ilimitados", "Todos os temas", "Dominio proprio", "Meta Pixel, GA e TikTok Pixel", "Taxa reduzida", "Remover marca d'agua"]}
            cta="Fazer upgrade"
          />
        </div>
      </section>

      <section className="bg-[#0A0A0A] px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">FAQ</p>
            <h2 className="mt-4 font-heading text-4xl font-black tracking-[-0.06em]">Perguntas que aparecem antes da primeira venda.</h2>
            <p className="mt-5 text-base leading-7 text-white/50">Respostas diretas para quem quer comecar rapido e entender o modelo.</p>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#111]">
            {faq.map((item, index) => (
              <button key={item.q} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="block w-full border-b border-white/[0.06] p-5 text-left last:border-b-0">
                <span className="flex items-center justify-between gap-4 font-heading text-base font-black">
                  {item.q}
                  <ChevronDown className={`shrink-0 transition ${openFaq === index ? "rotate-180 text-[#FF4D6D]" : "text-white/36"}`} size={18} />
                </span>
                <span className={`block overflow-hidden text-sm leading-7 text-white/50 transition-all duration-300 ${openFaq === index ? "mt-3 max-h-48" : "max-h-0"}`}>
                  {item.a}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <LandingBlogPreview />
      <section className="relative overflow-hidden bg-[#070707] px-5 py-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 rounded-full bg-[#FF4D6D]/14 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Proxima acao</p>
          <h2 className="mt-4 font-heading text-5xl font-black leading-tight tracking-[-0.075em] md:text-6xl">
            Pare de vender no improviso.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/52">Monte sua loja, cole o link na bio e teste sua primeira oferta digital hoje.</p>
          <Link href="/registro" className="animate-pulse-soft mt-9 inline-flex h-14 items-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_24px_80px_rgba(255,77,109,0.35)]">
            Criar minha loja gratis
            <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-[#070707] px-5 pb-10 pt-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/[0.08] bg-[#0f0f0f]/90 p-7 shadow-[0_34px_120px_rgba(0,0,0,0.62),0_0_80px_rgba(255,77,109,0.06)] backdrop-blur md:p-9">
          <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div>
              <BrandLogo imageClassName="size-9" textClassName="text-2xl text-white" />
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/44">Loja na bio para criadores brasileiros venderem produtos digitais com Mercado Pago, upsell e entrega automatica.</p>
              <div className="mt-5 flex gap-3 text-white/40">
                <Instagram size={18} />
                <Music2 size={18} />
                <Facebook size={18} />
              </div>
            </div>
            <div>
              <p className="font-heading text-sm font-black uppercase tracking-[0.16em] text-white/70">Plataforma</p>
              <div className="mt-4 grid gap-3">
                <Link href="/login" className="text-sm font-bold text-white/38 transition hover:text-white">Login</Link>
                <Link href="/blog" className="text-sm font-bold text-white/38 transition hover:text-white">Blog</Link>
                <Link href="/como-funciona" className="text-sm font-bold text-white/38 transition hover:text-white">Como funciona</Link>
                <Link href="/demo" className="text-sm font-bold text-white/38 transition hover:text-white">Loja de exemplo</Link>
              </div>
            </div>
            <FooterColumn title="Legal" links={[
              { label: "Termos", href: "/termos" },
              { label: "Privacidade", href: "/privacidade" },
              { label: "Solicitar dados", href: "/privacidade/solicitar" },
              { label: "Contato", href: "/contato" },
            ]} />
          </div>
        </div>
      </footer>

      <Modal open={exampleStoreOpen} title="Loja de exemplo" onClose={() => setExampleStoreOpen(false)} maxWidth="max-w-[460px]">
        <div className="bg-[#080808] p-5">
          <div className="mx-auto w-full max-w-[340px] rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,#242424,#0b0b0b)] p-3 shadow-[0_34px_90px_rgba(0,0,0,0.55)]">
            <div className="overflow-hidden rounded-[1.55rem] bg-[#080808]">
              <div className="h-8 bg-black px-5 text-[10px] font-black leading-8 text-white/45">9:41</div>
              <div className="h-[560px] overflow-y-auto store-scrollbar">
                {selectedProduct ? (
                  <ProductPage
                    creator={{ ...landingCreator, username: "lojaexemplo" }}
                    product={selectedProduct}
                    otherProducts={landingProducts.filter((item) => item.id !== selectedProduct.id)}
                    theme={landingCreator.theme}
                    embedded
                    embeddedCheckout
                    onBack={() => setSelectedProduct(null)}
                    onProductChange={setSelectedProduct}
                  />
                ) : (
                  <StorePage
                    creator={{ ...landingCreator, username: "lojaexemplo" }}
                    products={landingProducts}
                    theme={landingCreator.theme}
                    embedded
                    previewMode
                    onProductClick={setSelectedProduct}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

function FlowMockEditor() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0b] text-left shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/28">Dashboard</span>
          <p className="text-xs font-black text-white/80">Editando loja</p>
        </div>
        <span className="rounded-full bg-[#22C55E]/10 px-2 py-1 text-[10px] font-black text-[#22C55E]">Preview ativo</span>
      </div>
      <div className="grid gap-3 p-4">
        <div className="grid gap-1">
          <span className="text-[10px] font-bold text-white/35">Nome da loja</span>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-black text-white">Ana Fitness</div>
        </div>
        <div className="grid gap-1">
          <span className="text-[10px] font-bold text-white/35">Link publico</span>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2">
            <span className="truncate text-[11px] font-bold text-white/55">pik.bio/anafitness</span>
            <span className="rounded-full bg-[#FF4D6D]/12 px-2 py-1 text-[9px] font-black text-[#FF4D6D]">copiar</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["#FF4D6D", "#7C3AED", "#22C55E", "#F59E0B"].map((color) => (
            <span key={color} className="h-7 rounded-lg border border-white/10" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/35">Produtos</span>
            <span className="text-[10px] font-black text-[#FF4D6D]">+ Novo</span>
          </div>
          {[
            ["Planilha 12 semanas", "R$ 47"],
            ["Ebook Low Carb", "R$ 27"],
          ].map(([name, price]) => (
            <div key={name} className="mt-2 flex items-center gap-2 rounded-xl bg-black/30 p-2">
              <span className="size-8 rounded-lg bg-[linear-gradient(135deg,#FF4D6D,#F59E0B)]" />
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/72">{name}</span>
              <span className="text-[11px] font-black text-white">{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowMockBio() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#050505] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
      <div className="h-20 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,#FF4D6D,#7C3AED)]" />
      <div className="-mt-8 px-4 pb-4 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full border-4 border-[#050505] bg-[#FF4D6D] text-sm font-black text-white">AF</div>
        <p className="mt-2 text-sm font-black">Ana Fitness</p>
        <p className="mx-auto mt-1 max-w-[190px] text-[11px] leading-5 text-white/42">Treinos e planilhas para evoluir sem complicar.</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {["Instagram", "TikTok", "WhatsApp"].map((item) => (
            <span key={item} className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[9px] font-black text-white/48">{item}</span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ["Planilha 12 semanas", "R$ 47"],
            ["Mentoria 1h", "R$ 197"],
          ].map(([name, price]) => (
            <div key={name} className="rounded-2xl border border-white/[0.07] bg-[#111] p-2 text-left">
              <div className="h-16 rounded-xl bg-[linear-gradient(135deg,#FF4D6D,#F59E0B)]" />
              <p className="mt-2 line-clamp-2 text-[10px] font-black leading-4">{name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-[#FF4D6D]">{price}</span>
                <span className="rounded-full bg-[#FF4D6D] px-2 py-1 text-[9px] font-black">Comprar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowMockPayment() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white text-black shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
      <div className="border-b border-black/10 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/35">Pedido #1842</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-black">Planilha 12 semanas</p>
          <span className="rounded-full bg-[#22C55E]/12 px-2 py-1 text-[10px] font-black text-[#16A34A]">MP</span>
        </div>
      </div>
      <div className="grid gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-lg border border-black/10 bg-[#009EE3] p-3 text-center text-xs font-black text-white">
            Mercado Pago
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/35">Total</p>
            <p className="mt-1 font-heading text-3xl font-black tracking-[-0.06em] text-[#16A34A]">R$ 47</p>
            <p className="mt-2 rounded-lg bg-black/[0.04] px-2 py-1 text-[10px] font-bold text-black/45">checkout seguro</p>
          </div>
        </div>
        <div className="grid gap-2 rounded-2xl bg-[#F7F7F7] p-3">
          {[
            ["Pagamento aprovado", "agora"],
            ["Acesso enviado", "email"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-black/55">{label}</span>
              <span className="font-black text-[#16A34A]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyVisual({ type, accent }: { type: "store" | "product" | "checkout" | "access" | "dashboard"; accent: string }) {
  const rows = {
    store: ["Perfil do criador", "Produto em destaque", "Botao comprar"],
    product: ["Imagem + titulo", "Preco claro", "Oferta pronta"],
    checkout: ["Dados do comprador", "Pagamento", "Confirmacao"],
    access: ["Token seguro", "Link liberado", "Email enviado"],
    dashboard: ["Receita", "Vendas", "Acessos"],
  }[type];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0f0f0f] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <div className="absolute -right-12 -top-12 size-32 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accent }} />
      <div className="relative rounded-[22px] border border-white/[0.08] bg-[#070707] p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-red-400/70" />
            <span className="size-2 rounded-full bg-yellow-400/70" />
            <span className="size-2 rounded-full bg-green-400/70" />
          </div>
          <span className="rounded-full px-2 py-1 text-[9px] font-black uppercase text-white" style={{ backgroundColor: accent }}>
            ao vivo
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {type === "store" && (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <div className="h-16" style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.08))` }} />
              <div className="p-3">
                <div className="-mt-9 grid size-12 place-items-center rounded-full border-4 border-[#101010] text-xs font-black text-white" style={{ backgroundColor: accent }}>PK</div>
                <div className="mt-3 h-3 w-28 rounded-full bg-white/24" />
                <div className="mt-2 h-2 w-40 rounded-full bg-white/12" />
              </div>
            </div>
          )}
          {type === "product" && (
            <div className="grid grid-cols-[82px_1fr] gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
              <div className="aspect-square rounded-xl" style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.12))` }} />
              <div className="min-w-0">
                <div className="h-3 w-32 rounded-full bg-white/24" />
                <div className="mt-2 h-2 w-24 rounded-full bg-white/12" />
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-heading text-lg font-black" style={{ color: accent }}>R$ 47</span>
                  <span className="h-8 w-20 rounded-full" style={{ backgroundColor: accent }} />
                </div>
              </div>
            </div>
          )}
          {type === "checkout" && (
            <div className="rounded-2xl border border-white/[0.08] bg-white p-4 text-black">
              <div className="h-3 w-28 rounded-full bg-black/15" />
              <div className="mt-4 grid gap-2">
                <div className="h-9 rounded-xl bg-black/[0.06]" />
                <div className="h-9 rounded-xl bg-black/[0.06]" />
                <div className="h-10 rounded-full text-center text-xs font-black leading-10 text-white" style={{ backgroundColor: accent }}>Pagar agora</div>
              </div>
            </div>
          )}
          {type === "access" && (
            <div className="rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-[#22C55E]"><Check size={16} /> Acesso liberado</p>
              <div className="mt-4 rounded-full border border-white/[0.08] bg-black/30 px-4 py-3 text-xs font-bold text-white/62">/acesso/pkb••••</div>
            </div>
          )}
          {type === "dashboard" && (
            <div className="grid grid-cols-3 gap-2">
              {["R$ 4.8k", "124", "98%"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
                  <p className="font-heading text-lg font-black" style={{ color: accent }}>{item}</p>
                  <div className="mt-2 h-2 rounded-full bg-white/12" />
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2">
            {rows.map((row, index) => (
              <div key={row} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
                <span className="text-xs font-bold text-white/56">{row}</span>
                <span className="size-2 rounded-full landing-flow-dot" style={{ backgroundColor: index === rows.length - 1 ? "#22C55E" : accent }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCarouselCard({ templateId }: { templateId: TemplateId }) {
  const template = storeTemplates[templateId];
  const theme = THEME_PRESETS[templateId];
  const details = templateDetails[templateId];

  return (
    <div className="w-[300px] shrink-0 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.36)] transition duration-300 hover:-translate-y-1 hover:border-[#FF4D6D]/30">
      <div className="p-3">
        <div
          className="overflow-hidden rounded-[24px] border border-white/[0.08] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ background: theme.backgroundColor }}
        >
          <div className="relative h-24 overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${template.defaultAccent}, rgba(255,255,255,0.08))` }}>
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-3 left-3 h-2 w-20 rounded-full bg-white/35" />
            <div className="absolute bottom-3 right-3 h-2 w-10 rounded-full bg-white/20" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: template.defaultAccent }}>
              PK
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">Creator Store</p>
              <p className="text-[10px] font-bold text-white/42">{details.tag}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {[0, 1].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.06] p-3 transition duration-300 group-hover:bg-white/[0.08]">
                <div className="h-14 rounded-xl bg-white/[0.08]" />
                <div className="mt-3 h-3 w-4/5 rounded-full bg-white/20" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="h-3 w-14 rounded-full bg-white/12" />
                  <div className="h-7 w-20 rounded-full" style={{ backgroundColor: template.defaultAccent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-black tracking-[-0.04em] text-white">{template.name}</h4>
          <div className="mt-1 flex gap-1.5">
            {[theme.storeLayout, theme.cardLayout].map((item) => (
              <span key={item} className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] font-black uppercase text-white/34">
                {item}
              </span>
            ))}
          </div>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-black uppercase text-white/44">
          {details.tag}
        </span>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  eyebrow,
  price,
  suffix,
  description,
  features,
  missing = [],
  cta,
  pro = false,
}: {
  title: string;
  eyebrow: string;
  price: string;
  suffix: string;
  description: string;
  features: string[];
  missing?: string[];
  cta: string;
  pro?: boolean;
}) {
  return (
    <Reveal>
      <div className={`relative h-full rounded-[32px] border p-7 ${pro ? "border-[#FF4D6D]/70 bg-[linear-gradient(135deg,rgba(255,77,109,0.12),rgba(124,58,237,0.08))]" : "border-white/[0.07] bg-[#111]"}`}>
        {pro && <span className="absolute right-5 top-5 rounded-full bg-[#FF4D6D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">Mais escolhido</span>}
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/38">{eyebrow}</p>
        <h3 className="mt-3 font-heading text-3xl font-black tracking-[-0.05em]">{title}</h3>
        <div className="mt-6 flex items-end gap-1">
          <p className="font-heading text-5xl font-black tracking-[-0.075em]">{price}</p>
          <p className="pb-2 text-sm font-bold text-white/42">{suffix}</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
        <div className="mt-7 grid gap-3">
          {features.map((item) => (
            <div key={item} className="flex gap-3 text-sm font-bold text-white/76">
              <Check className="shrink-0 text-[#22C55E]" size={16} />
              {item}
            </div>
          ))}
        </div>
        {missing.length > 0 && (
          <>
            <div className="my-6 h-px bg-white/[0.07]" />
            <div className="grid gap-3">
              {missing.map((item) => (
                <div key={item} className="flex gap-3 text-sm font-bold text-white/30">
                  <span className="text-white/20">-</span>
                  {item}
                </div>
              ))}
            </div>
          </>
        )}
        <Link href="/registro" className={`mt-8 grid h-12 place-items-center rounded-full text-sm font-black ${pro ? "bg-[#FF4D6D] text-white" : "bg-white text-black"}`}>
          {cta}
        </Link>
      </div>
    </Reveal>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-heading text-sm font-black uppercase tracking-[0.16em] text-white/70">{title}</p>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-bold text-white/38 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const flowSteps = [
  {
    number: "01",
    icon: Store,
    title: "Monte a vitrine",
    text: "Edite perfil, capa, video, links, produtos e tema vendo tudo acontecer no preview mobile.",
    visual: <FlowMockEditor />,
  },
  {
    number: "02",
    icon: ShoppingBag,
    title: "Venda no clique",
    text: "O seguidor entra pela bio, escolhe o produto e compra sem sair da pagina.",
    visual: <FlowMockBio />,
  },
  {
    number: "03",
    icon: Wallet,
    title: "Receba e entregue",
    text: "Checkout Mercado Pago, upsell oferecido e acesso enviado por email no fluxo de compra.",
    visual: <FlowMockPayment />,
  },
];

const clientJourney = [
  {
    label: "Entrada",
    icon: MousePointerClick,
    visual: "store" as const,
    accent: "#FF4D6D",
    title: "Cliente toca no link da bio",
    text: "Ele cai direto na loja do criador, com perfil, produtos e visual pronto para comprar.",
  },
  {
    label: "Escolha",
    icon: ShoppingBag,
    visual: "product" as const,
    accent: "#38BDF8",
    title: "Escolhe o produto digital",
    text: "O card mostra nome, imagem, preço e botão claro, sem mandar o cliente para uma conversa manual.",
  },
  {
    label: "Compra",
    icon: Wallet,
    visual: "checkout" as const,
    accent: "#FF4D6D",
    title: "Finaliza o checkout",
    text: "O pedido é criado, o pagamento é processado e o criador acompanha tudo pelo painel.",
  },
  {
    label: "Entrega",
    icon: ShieldCheck,
    visual: "access" as const,
    accent: "#22C55E",
    title: "Recebe o acesso seguro",
    text: "Depois da aprovação, o comprador recebe o link, arquivo ou mensagem configurada no produto.",
  },
  {
    label: "Gestão",
    icon: BarChart3,
    visual: "dashboard" as const,
    accent: "#F59E0B",
    title: "Criador vê o resultado",
    text: "Vendas, acessos liberados, produtos e receita ficam organizados para melhorar as próximas ofertas.",
  },
];

const demoJourney = [
  { icon: ShoppingBag, title: "Produto escolhido", time: "0s", text: "O cliente clica no card e ve resumo, preco e campos sem sair da loja." },
  { icon: Sparkles, title: "Upsell opcional", time: "15s", text: "Uma oferta complementar aparece com desconto, sempre com recusa facil." },
  { icon: Zap, title: "Checkout aberto", time: "30s", text: "O cliente segue para o pagamento seguro do Mercado Pago com o pedido consolidado." },
  { icon: ShieldCheck, title: "Entrega confirmada", time: "60s", text: "A tela final mostra quais produtos serao enviados para o email informado." },
];

const templateDetails: Record<TemplateId, { tag: string; description: string; bullets: string[] }> = {
  minimal: {
    tag: "Foco",
    description: "Lista limpa, direta e elegante para quem quer poucos produtos com leitura rapida.",
    bullets: ["Oferta enxuta", "Muito respiro", "Otimo para mobile"],
  },
  cards: {
    tag: "Popular",
    description: "Grid visual com capas grandes, preco claro e botao de compra em destaque.",
    bullets: ["2+ produtos", "Visual comercial", "Conversao direta"],
  },
  glass: {
    tag: "Premium",
    description: "Visual translucido com fundo profundo e sensacao moderna.",
    bullets: ["Marca sofisticada", "Produtos visuais", "Diferenciacao"],
  },
  bold: {
    tag: "Impacto",
    description: "Preto, tipografia forte e atitude streetwear para marca autoral.",
    bullets: ["Cultura e moda", "Contraste alto", "Identidade forte"],
  },
  magazine: {
    tag: "Editorial",
    description: "Leitura de revista, produto como linha editorial e um ritmo mais sofisticado.",
    bullets: ["Autores e curadores", "Conteudo premium", "Estetica refinada"],
  },
  retro: {
    tag: "Nostalgia",
    description: "Cores quentes, bordas marcadas e sombra offset com cara memoravel.",
    bullets: ["Criativos", "Produtos divertidos", "Personalidade"],
  },
  soft: {
    tag: "Acolhedor",
    description: "Pastel, cantos arredondados e tom humano para bem-estar e mentorias.",
    bullets: ["Wellness", "Coaches", "Comunidade"],
  },
  cleanpro: {
    tag: "Pro",
    description: "Minimalista, profissional e confiavel para consultores e servicos digitais.",
    bullets: ["B2B", "Mentorias", "Leitura rapida"],
  },
};

const faq = [
  { q: "Preciso ter CNPJ?", a: "Nao. O MVP foi pensado para criadores validarem produtos digitais rapidamente. Em operacao real, regras fiscais devem ser avaliadas com um contador." },
  { q: "Quais produtos posso vender?", a: "E-books, PDFs, planilhas, templates, cursos, mentorias, packs e comunidades. O foco do MVP e 100% digital." },
  { q: "O pagamento e real?", a: "Nao neste projeto. O fluxo de checkout e confirmacao e mockado para demonstrar UX e produto." },
  { q: "Posso mudar o visual da loja?", a: "Sim. O tema controla cores, fonte, avatar, cards, botoes, links e layout, com preview ao vivo." },
  { q: "A pagina funciona no celular?", a: "Sim. A experiencia publica e mobile-first, e o dashboard tambem tem ajustes para mobile, tablet e desktop." },
  { q: "Tem upsell?", a: "Sim. O produto pode oferecer outro produto como upsell antes do pagamento." },
];
