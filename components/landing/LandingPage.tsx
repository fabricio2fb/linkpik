"use client";

import Link from "next/link";
import {
  ArrowRight,
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

const heroRetroTheme = {
  ...THEME_PRESETS.retro,
  backgroundColor: "#FFF5D8",
  surfaceColor: "#FFE7B8",
  textPrimaryColor: "#050505",
  textSecondaryColor: "#302318",
  buttonTextColor: "#050505",
  cardBorderColor: "#050505",
};

const heroMockupCreator = {
  ...landingCreator,
  coverImage: null,
  avatarImage: "/hero-retro-avatar.png",
  template: "retro" as const,
  theme: heroRetroTheme,
  avatarColor: heroRetroTheme.accentColor,
  accentColor: heroRetroTheme.accentColor,
};

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
      <nav className="absolute inset-x-0 top-0 z-50 px-4">
        <div
          className={`mx-auto flex h-20 max-w-7xl items-center justify-between px-0 backdrop-blur-xl transition duration-300 ${scrolled
            ? "bg-[#B91C3A]/72"
            : "bg-transparent"
            }`}
        >
          <BrandLogo imageSrc="/logo-pikbio-white.png" className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]" imageClassName="size-10" textClassName="text-2xl [color:#fff]" />

          <div className="hidden items-center gap-10 text-lg font-black md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="drop-shadow-[0_6px_18px_rgba(0,0,0,0.20)] transition hover:opacity-80"
                style={{ color: "#fff" }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-2.5 py-2 text-lg font-black drop-shadow-[0_6px_18px_rgba(0,0,0,0.20)] transition hover:opacity-80 sm:px-4"
              style={{ color: "#fff" }}
            >
              Entrar
            </Link>

            <Link
              href="/registro"
              className="group inline-flex h-12 items-center justify-center rounded-full border border-white/30 bg-white/15 px-4 text-lg font-black shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/24 sm:px-6"
              style={{ color: "#fff" }}
            >
              Começar grátis
              <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={16} />
            </Link>
          </div>
        </div>
      </nav>

      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-[#FF4D6D] px-5 pb-20 pt-32 md:pt-36"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_16%_28%,rgba(17,24,39,0.22),transparent_32%),linear-gradient(135deg,#FF4D6D_0%,#E6355A_52%,#B91C3A_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent)]" />
        <div className="pointer-events-none absolute left-1/2 top-28 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-white/12 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          {/* Coluna 1: texto */}
          <div className="text-center lg:text-left">
            <h1 className="max-w-5xl font-heading text-[44px] font-black leading-[0.94] tracking-[-0.07em] text-white sm:text-[68px] lg:text-[84px] xl:text-[92px]" style={{ color: "#fff" }}>
              <span className={`animate-fadeUp block ${heroVisible ? "visible" : ""}`} style={{ color: "#fff" }}>
                Sua bio vira
              </span>
              <span className={`animate-fadeUp delay-100 block ${heroVisible ? "visible" : ""}`} style={{ color: "#fff" }}>
                uma loja digital
              </span>
              <span
                className={`animate-fadeUp delay-200 block drop-shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${heroVisible ? "visible" : ""
                  }`}
                style={{ color: "#fff" }}
              >
                pronta para vender.
              </span>
            </h1>

            <p
              className={`animate-fadeUp delay-300 mx-auto mt-7 max-w-[610px] text-lg leading-8 sm:text-xl lg:mx-0 ${heroVisible ? "visible" : ""
                }`}
              style={{ color: "#fff" }}
            >
              Crie uma vitrine bonita, cobre pelo checkout e entregue o acesso digital automaticamente. O seguidor entende a oferta, compra e recebe sem depender do direct.
            </p>

            <div
              className={`animate-fadeUp delay-400 mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start ${heroVisible ? "visible" : ""
                }`}
            >
              <Link
                href="/registro"
                className="group inline-flex h-14 items-center justify-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_26px_80px_rgba(255,77,109,0.34)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]"
                style={{ color: "#fff" }}
              >
                Criar minha loja gratis
                <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={18} />
              </Link>

              <a
                href="#demo"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-8 text-base font-black !text-white transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                style={{ color: "#fff" }}
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
            <div className="absolute left-1/2 top-1/2 h-[640px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-[90px]" />
            <div className="absolute left-8 top-12 z-20 hidden rounded-3xl bg-white/14 px-5 py-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:block" style={{ color: "#fff" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/62">Pedido aprovado</p>
              <p className="mt-1 font-heading text-2xl font-black">R$ 66,00</p>
            </div>
            <div className="absolute bottom-16 right-3 z-20 hidden rounded-3xl bg-[#111827]/70 px-5 py-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:block" style={{ color: "#fff" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] !text-white">Acesso</p>
              <p className="mt-1 text-sm font-black !text-white">Liberado</p>
            </div>

            <div className="relative z-10 mx-auto w-[318px] overflow-hidden rounded-[30px] bg-[#080808] shadow-[0_44px_110px_rgba(95,12,31,0.38)] sm:w-[370px]">
              <div className="scrollbar-hidden h-[640px] overflow-y-auto">
                {selectedProduct ? (
                  <ProductPage
                    creator={heroMockupCreator}
                    product={selectedProduct}
                    otherProducts={landingProducts.filter((item) => item.id !== selectedProduct.id)}
                    theme={heroRetroTheme}
                    embedded
                    embeddedCheckout
                    onBack={() => setSelectedProduct(null)}
                    onProductChange={setSelectedProduct}
                  />
                ) : (
                  <StorePage
                    creator={heroMockupCreator}
                    products={landingProducts}
                    theme={heroRetroTheme}
                    embedded
                    previewMode
                    onProductClick={setSelectedProduct}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingBelowFold />
    </main>
  );
}
