"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export type HowItWorksNavItem = {
  id: string;
  label: string;
};

export default function HowItWorksSidebar({ items }: { items: HowItWorksNavItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const activeLabel = useMemo(() => items.find((item) => item.id === activeId)?.label ?? items[0]?.label, [activeId, items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -64% 0px", threshold: [0.08, 0.18, 0.32, 0.5] },
    );

    items.forEach((item) => {
      const node = document.getElementById(item.id);
      if (node) observer.observe(node);
    });

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[300px] border-r border-white/[0.08] bg-[#070707]/94 px-6 py-7 backdrop-blur-xl lg:flex lg:flex-col">
        <BrandLogo textClassName="text-white" imageClassName="size-9" />

        <div className="relative mt-10 min-h-0 flex-1">
          <div className="absolute left-0 top-0 h-full w-px bg-white/[0.08]" />
          <div className="absolute left-0 top-0 w-px bg-[#FF4D6D] transition-[height] duration-200" style={{ height: `${progress * 100}%` }} />

          <nav className="grid gap-1 pl-5">
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/[0.04] hover:text-white ${
                    active ? "bg-[#FF4D6D]/10 font-black text-white" : "font-bold text-white/42"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <Link href="/registro" className="mt-7 grid h-12 place-items-center rounded-full bg-[#FF4D6D] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#FF2D55]">
          Começar agora
        </Link>
      </aside>

      <div className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070707]/94 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <BrandLogo compact imageClassName="size-8" />
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 text-sm font-black text-white"
          >
            <span className="truncate">{activeLabel}</span>
            <ChevronDown className={`shrink-0 transition ${open ? "rotate-180" : ""}`} size={16} />
          </button>
        </div>
        {open && (
          <div className="mx-auto mt-3 grid max-w-3xl gap-1 rounded-2xl border border-white/[0.08] bg-[#101010] p-2 shadow-2xl">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(item.id)}
                className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${item.id === activeId ? "bg-[#FF4D6D]/12 text-white" : "text-white/52"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
