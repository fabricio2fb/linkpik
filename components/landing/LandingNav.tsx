"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { label: "Como funciona", href: "/como-funciona" },
  { label: "Preços", href: "/#precos" },
  { label: "Blog", href: "/blog" },
  { label: "Temas", href: "/#templates" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 36);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed inset-x-0 top-4 z-50 px-4">
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border px-4 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition duration-300 sm:px-5 ${
          scrolled
            ? "border-white/[0.12] bg-[#0b0b0b]/88"
            : "border-white/[0.08] bg-[#0b0b0b]/62"
        }`}
      >
        <BrandLogo textClassName="text-white" className="drop-shadow-[0_0_30px_rgba(255,77,109,0.5)_0_0_60px_rgba(255,77,109,0.25)]" />

        <div className="hidden items-center gap-8 text-sm font-bold text-white/52 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-2.5 py-2 text-sm font-bold text-white/55 transition hover:text-white sm:px-4"
          >
            Entrar
          </Link>

          <Link
            href="/registro"
            className="group inline-flex h-11 items-center justify-center rounded-full bg-white px-3.5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#FF4D6D] hover:text-white sm:px-5"
          >
            Começar grátis
            <ArrowRight className="ml-2 transition group-hover:translate-x-0.5" size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
