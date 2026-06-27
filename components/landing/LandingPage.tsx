"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import LandingBelowFold from "@/components/landing/LandingBelowFold";
import StorePage from "@/components/store/StorePage";
import ProductPage from "@/components/store/ProductPage";
import { landingCreator, landingProducts } from "@/components/landing/landing-content";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { useInView } from "@/lib/use-in-view";
import type { Product } from "@/lib/types";

const navItems = [
  { label: "Plataforma", href: "#produto" },
  { label: "Demo", href: "/demo" },
  { label: "Temas", href: "#templates" },
  { label: "Preços", href: "#precos" },
];

const heroBadges = [
  "Loja na bio",
  "Checkout Mercado Pago",
  "Produtos digitais",
  "Upsell automático",
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroVisible = useInView(heroRef);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 36);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="site-light-landing min-h-screen overflow-hidden bg-[#F7F8FB] text-[#111827]">
      <nav className="fixed inset-x-0 top-4 z-50 px-4">
        <div
          className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border px-4 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition duration-300 sm:px-5 ${scrolled
            ? "border-white/[0.12] bg-[#0b0b0b]/88"
            : "border-white/[0.08] bg-[#0b0b0b]/62"
            }`}
        >
          <BrandLogo textClassName="text-white" />

          <div className="hidden items-center gap-8 text-sm font-bold text-white/52 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-white/55 transition hover:text-white sm:block"
            >
              Entrar
            </Link>

            <Link
              href="/registro"
              className="group inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#FF4D6D] hover:text-white"
            >
              Começar grátis
              <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={16} />
            </Link>
          </div>
        </div>
      </nav>

      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden px-5 pb-20 pt-32 md:pt-36"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,77,109,0.18),transparent_34%),radial-gradient(circle_at_15%_32%,rgba(124,58,237,0.16),transparent_30%),radial-gradient(circle_at_85%_44%,rgba(34,197,94,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045),transparent)]" />
        <div className="pointer-events-none absolute left-1/2 top-28 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#FF4D6D]/10 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          {/* Coluna 1: texto */}
          <div className="text-center lg:text-left">
            <div
              className={`animate-fadeUp inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${heroVisible ? "visible" : ""
                }`}
            >
              <span className="grid size-7 place-items-center rounded-full bg-[#FF4D6D]/15 text-[#FF4D6D]">
                <Sparkles size={14} />
              </span>
              Plataforma para criadores digitais
            </div>

            <h1 className="mt-7 max-w-5xl font-heading text-[46px] font-black leading-[0.92] tracking-[-0.08em] text-white sm:text-[70px] lg:text-[88px] xl:text-[96px]">
              <span className={`animate-fadeUp block ${heroVisible ? "visible" : ""}`}>
                Transforme sua bio
              </span>
              <span className={`animate-fadeUp delay-100 block ${heroVisible ? "visible" : ""}`}>
                em uma loja que
              </span>
              <span
                className={`animate-fadeUp delay-200 block bg-[linear-gradient(90deg,#FF4D6D,#FFB020,#22C55E)] bg-clip-text text-transparent ${heroVisible ? "visible" : ""
                  }`}
              >
                vende sozinha.
              </span>
            </h1>

            <p
              className={`animate-fadeUp delay-300 mx-auto mt-7 max-w-[650px] text-lg leading-8 text-white/58 sm:text-xl lg:mx-0 ${heroVisible ? "visible" : ""
                }`}
            >
              O Pikbio junta página de vendas, link na bio, checkout, upsell e entrega
              digital em uma experiência simples, bonita e pronta para converter seguidores
              em clientes.
            </p>

            <div
              className={`animate-fadeUp delay-400 mt-8 flex flex-wrap justify-center gap-2 lg:justify-start ${heroVisible ? "visible" : ""
                }`}
            >
              {heroBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/48"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div
              className={`animate-fadeUp delay-400 mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start ${heroVisible ? "visible" : ""
                }`}
            >
              <Link
                href="/registro"
                className="group inline-flex h-14 items-center justify-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_26px_80px_rgba(255,77,109,0.34)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]"
              >
                Criar minha loja grátis
                <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={18} />
              </Link>

              <a
                href="#demo"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-8 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                Ver demo funcionando
              </a>
            </div>
          </div>

          {/* Coluna 2: mockup do celular (estava aninhado dentro da coluna 1, quebrando o grid) */}
          <div
            className={`animate-fadeUp delay-300 relative mx-auto w-full max-w-[590px] ${heroVisible ? "visible" : ""
              }`}
          >
            <div className="absolute left-1/2 top-1/2 h-[590px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4D6D]/18 blur-[90px]" />

            <div className="relative mx-auto w-[318px] rounded-[2.6rem] border border-white/15 bg-[linear-gradient(145deg,#2A2A2A,#080808)] p-3 shadow-[0_60px_140px_rgba(0,0,0,0.78),0_0_120px_rgba(255,77,109,0.16)] sm:w-[370px]">
              <div className="absolute left-1/2 top-3 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black" />

              <div className="overflow-hidden rounded-[1.9rem] bg-[#080808]">
                <div className="flex h-9 items-center justify-between bg-black px-6 text-[10px] font-black text-white/45">
                  <span>9:41</span>
                  <span>Pikbio</span>
                  <span>5G</span>
                </div>

                <div className="scrollbar-hidden h-[640px] overflow-y-auto">
                  {selectedProduct ? (
                    <ProductPage
                      creator={{ ...landingCreator, coverImage: null }}
                      product={selectedProduct}
                      otherProducts={landingProducts.filter((item) => item.id !== selectedProduct.id)}
                      theme={THEME_PRESETS.cards}
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
                      theme={THEME_PRESETS.cards}
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
      </section>

      <LandingBelowFold />
    </main>
  );
}
