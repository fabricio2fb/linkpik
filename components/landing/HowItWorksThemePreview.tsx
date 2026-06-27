"use client";

import { useEffect, useRef, useState } from "react";
import StorePage from "@/components/store/StorePage";
import { landingCreator, landingProducts } from "@/components/landing/landing-content";
import { storeTemplates } from "@/components/store/templates";
import { THEME_PRESETS, themePresetIds } from "@/lib/theme-presets";
import type { TemplateId } from "@/lib/types";

const FADE_MS = 150;
const MANUAL_PAUSE_MS = 8000;

export default function HowItWorksThemePreview() {
  const [activeTheme, setActiveTheme] = useState<TemplateId>("cards");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const activeThemeRef = useRef(activeTheme);
  const intervalRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    activeThemeRef.current = activeTheme;
  }, [activeTheme]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      stopAutoPlay();
      if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current);
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  function stopAutoPlay() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function startAutoPlay() {
    stopAutoPlay();
    intervalRef.current = window.setInterval(() => {
      const index = themePresetIds.indexOf(activeThemeRef.current);
      changeTheme(themePresetIds[(index + 1) % themePresetIds.length]);
    }, 3200);
  }

  function changeTheme(themeId: TemplateId) {
    if (themeId === activeThemeRef.current) return;
    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);

    setIsTransitioning(true);
    fadeTimeoutRef.current = window.setTimeout(() => {
      activeThemeRef.current = themeId;
      setActiveTheme(themeId);
      window.setTimeout(() => setIsTransitioning(false), 30);
    }, FADE_MS);
  }

  function selectTheme(themeId: TemplateId) {
    stopAutoPlay();
    if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current);
    changeTheme(themeId);
    pauseTimeoutRef.current = window.setTimeout(startAutoPlay, MANUAL_PAUSE_MS);
  }

  const theme = THEME_PRESETS[activeTheme];
  const template = storeTemplates[activeTheme];

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,390px)] lg:items-center">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Personalizando o visual</p>
        <h2 className="mt-4 max-w-full break-words font-heading text-4xl font-black tracking-[-0.055em] text-white">Sua loja com cara de marca, sem programar.</h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/52">
          Escolha entre 8 temas, ajuste cores, fontes, formatos de card, botões e veja tudo no preview ao vivo do celular.
        </p>

        <div className="mt-7 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {themePresetIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTheme(id)}
              className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(255,77,109,0.10)] ${
                activeTheme === id ? "border-[#FF4D6D] bg-[#FF4D6D]/12" : "border-white/[0.08] bg-white/[0.035]"
              }`}
            >
              <span className="block text-sm font-black text-white">{storeTemplates[id].name}</span>
              <span className="mt-1 block text-xs text-white/42">{storeTemplates[id].description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[390px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/34">Tema ativo</p>
            <p className="mt-1 font-heading text-xl font-black text-white">{template.name}</p>
          </div>
          <div className="size-9 rounded-full border border-white/15 transition" style={{ backgroundColor: template.defaultAccent }} />
        </div>

        <div className="rounded-[2rem] border border-white/[0.12] bg-[linear-gradient(145deg,#242424,#0b0b0b)] p-[6px] shadow-[0_34px_90px_rgba(0,0,0,0.55)] transition hover:shadow-[0_44px_120px_rgba(255,77,109,0.12)]">
          <div className="overflow-hidden rounded-[1.55rem] bg-[#080808]">
            <div className="flex h-8 items-center justify-between bg-black px-5 text-[10px] font-black text-white/45">
              <span>9:41</span>
              <span>Pikbio</span>
              <span>5G</span>
            </div>
            <div className={`h-[560px] overflow-y-auto store-scrollbar transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              <StorePage
                creator={{ ...landingCreator, coverImage: null, theme }}
                products={landingProducts}
                theme={theme}
                embedded
                previewMode
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {themePresetIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTheme(id)}
              className={`size-2.5 rounded-full transition ${activeTheme === id ? "scale-125 bg-[#FF4D6D]" : "bg-white/20 hover:bg-white/40"}`}
              aria-label={`Ver tema ${storeTemplates[id].name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
