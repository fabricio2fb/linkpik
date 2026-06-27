"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Creator, Product, TemplateId } from "@/lib/types";
import type { FontOption, StoreTheme } from "@/lib/theme";
import { autoTextForBackground, isLightColor } from "@/lib/theme";
import { THEME_PRESETS, themePresetIds } from "@/lib/theme-presets";
import { storeTemplates } from "@/components/store/templates";

type ThemeEditorProps = {
  creator: Creator;
  products: Product[];
  theme: StoreTheme;
  onThemeChange: (theme: StoreTheme) => void;
  onCreatorChange: (creator: Creator) => void;
  onToast: (message: string) => void;
};

const accents = ["#FF4D6D", "#00FF87", "#7C3AED", "#F59E0B", "#06B6D4", "#FF7A5C", "#10B981", "#F43F5E"];
const darkSwatches = ["#080808", "#0d0d0d", "#111111", "#171717", "#1a1410", "#0f0f1a"];
const lightSwatches = ["#F3F4F6", "#F6F7F9", "#F4F1EA", "#FFF3EE", "#FFF8E7", "#FAFAF8"];
const surfaceSwatches = ["#111111", "#1a1a1a", "#ffffff", "#F8FAFC", "#F1F5F9", "#FFFDFC"];
const headingFonts: FontOption[] = ["Plus Jakarta Sans", "Space Grotesk", "Playfair Display", "Syne", "Bebas Neue"];
const bodyFonts: FontOption[] = ["DM Sans", "Inter", "Nunito", "Lora", "Oswald"];

export default function ThemeEditor({ creator, products, theme, onThemeChange, onCreatorChange, onToast }: ThemeEditorProps) {
  const [open, setOpen] = useState("colors");
  const [lastTheme, setLastTheme] = useState<StoreTheme | null>(null);

  function update(next: Partial<StoreTheme>) {
    const merged = { ...theme, ...next };
    onThemeChange(merged);
    onCreatorChange({ ...creator, theme: merged, template: merged.template, accentColor: merged.accentColor, avatarColor: merged.accentColor });
  }

  function applyPreset(id: TemplateId) {
    setLastTheme(theme);
    const next = { ...THEME_PRESETS[id] };
    onThemeChange(next);
    onCreatorChange({ ...creator, theme: next, template: id, accentColor: next.accentColor, avatarColor: next.accentColor });
    onToast(`Tema '${storeTemplates[id].name}' aplicado. Suas customizações foram substituídas.`);
  }

  function undoPreset() {
    if (!lastTheme) return;
    update(lastTheme);
    setLastTheme(null);
    onToast("Tema anterior restaurado");
  }

  function setAccent(color: string) {
    update({
      accentColor: color,
      buttonTextColor: isLightColor(color) ? "#0a0a0a" : "#ffffff",
      avatarBorderColor: theme.avatarBorderColor === theme.accentColor ? color : theme.avatarBorderColor,
    });
  }

  function setMode(mode: "dark" | "light") {
    const backgroundColor = mode === "dark" ? "#080808" : "#F3F4F6";
    update({
      themeMode: mode,
      backgroundColor,
      surfaceColor: mode === "dark" ? "#111111" : "#ffffff",
      cardBorderColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.10)",
      cardShadow: mode === "dark" ? theme.cardShadow : "sm",
      cardShadowColor: mode === "dark" ? "rgba(0,0,0,0.18)" : "rgba(15,23,42,0.08)",
      textPrimaryColor: mode === "dark" ? "#ffffff" : "#111827",
      textSecondaryColor: mode === "dark" ? "#888888" : "#4B5563",
    });
  }

  return (
    <div className="grid gap-5">
      <section>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Preset</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))] lg:grid-cols-4">
          {themePresetIds.map((id) => {
            const preset = THEME_PRESETS[id];
            const selected = theme.template === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className={`group relative h-[120px] overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ease-out ${
                  selected ? "" : "hover:-translate-y-0.5 hover:border-white/15"
                }`}
                style={{
                  borderColor: selected ? theme.accentColor : "transparent",
                  boxShadow: selected ? `0 0 0 4px ${theme.accentColor}26` : "none",
                  cursor: "pointer",
                }}
              >
                {selected && (
                  <span
                    className="absolute right-2 top-2 z-10 grid size-5 animate-check-pop place-items-center rounded-full text-white"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Check size={12} />
                  </span>
                )}
                <div className="h-[85%] overflow-hidden" style={{ background: presetBackground(id) }}>
                  <PresetVisual id={id} accent={preset.accentColor} />
                </div>
                <div className="grid h-[15%] place-items-center bg-black/40 px-2 backdrop-blur">
                  <span
                    className="truncate text-[11px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: preset.textPrimaryColor }}
                  >
                    {storeTemplates[id].name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {lastTheme && (
          <button type="button" onClick={undoPreset} className="mt-3 text-sm font-bold text-[#FF4D6D]">
            Desfazer preset aplicado
          </button>
        )}
      </section>

      <Accordion id="colors" title="Cores" meta={<ColorDots theme={theme} />} open={open} setOpen={setOpen}>
        <Field title="Cor de destaque">
          <div className="flex flex-wrap gap-2">
            {accents.map((color) => <Swatch key={color} color={color} selected={theme.accentColor === color} onClick={() => setAccent(color)} />)}
          </div>
          <input className="input-base mt-3" value={theme.accentColor} onChange={(event) => setAccent(event.target.value)} />
        </Field>
        <Field title="Cor de fundo">
          <Segment values={[["solid", "Sólido"], ["gradient", "Gradiente"], ["mesh", "Mesh"]]} value={theme.backgroundType} onChange={(value) => update({ backgroundType: value as StoreTheme["backgroundType"] })} />
          {theme.backgroundType === "solid" && (
            <div className="mt-3 grid gap-3">
              <input className="input-base" value={theme.backgroundColor} onChange={(event) => update({ backgroundColor: event.target.value })} />
              <div className="flex flex-wrap gap-2">{[...darkSwatches, ...lightSwatches].map((color) => <Swatch key={color} color={color} selected={theme.backgroundColor === color} onClick={() => update({ backgroundColor: color, ...autoTextForBackground(color) })} />)}</div>
            </div>
          )}
          {theme.backgroundType === "gradient" && (
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="color" className="h-12 w-full" value={theme.backgroundGradient?.from ?? theme.backgroundColor} onChange={(event) => update({ backgroundGradient: { from: event.target.value, to: theme.backgroundGradient?.to ?? theme.accentColor, angle: theme.backgroundGradient?.angle ?? 135 } })} />
                <input type="color" className="h-12 w-full" value={theme.backgroundGradient?.to ?? theme.accentColor} onChange={(event) => update({ backgroundGradient: { from: theme.backgroundGradient?.from ?? theme.backgroundColor, to: event.target.value, angle: theme.backgroundGradient?.angle ?? 135 } })} />
              </div>
              <input type="range" min={0} max={360} value={theme.backgroundGradient?.angle ?? 135} onChange={(event) => update({ backgroundGradient: { from: theme.backgroundGradient?.from ?? theme.backgroundColor, to: theme.backgroundGradient?.to ?? theme.accentColor, angle: Number(event.target.value) } })} />
            </div>
          )}
        </Field>
        <Field title="Cor dos cards">
          <div className="flex flex-wrap gap-2">{surfaceSwatches.map((color) => <Swatch key={color} color={color} selected={theme.surfaceColor === color} onClick={() => update({ surfaceColor: color })} />)}</div>
          <input className="input-base mt-3" value={theme.surfaceColor} onChange={(event) => update({ surfaceColor: event.target.value })} />
        </Field>
        <Field title="Cor do texto">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input-base" value={theme.textPrimaryColor} onChange={(event) => update({ textPrimaryColor: event.target.value })} />
            <input className="input-base" value={theme.textSecondaryColor} onChange={(event) => update({ textSecondaryColor: event.target.value })} />
          </div>
        </Field>
        <Field title="Modo claro/escuro">
          <Segment values={[["dark", "Escuro"], ["light", "Claro"]]} value={theme.themeMode} onChange={(value) => setMode(value as "dark" | "light")} />
        </Field>
      </Accordion>

      <Accordion id="type" title="Tipografia" meta={<span className="text-lg font-bold">Aa</span>} open={open} setOpen={setOpen}>
        <FontGrid title="Fonte dos títulos" fonts={headingFonts} selected={theme.fontHeading} onSelect={(font) => update({ fontHeading: font })} />
        <FontGrid title="Fonte do corpo" fonts={bodyFonts} selected={theme.fontBody} onSelect={(font) => update({ fontBody: font })} />
        <Field title="Nome do criador">
          <Segment values={[["sm", "S"], ["md", "M"], ["lg", "L"], ["xl", "XL"]]} value={theme.nameSize} onChange={(value) => update({ nameSize: value as StoreTheme["nameSize"] })} />
          <Segment values={[["400", "Regular"], ["600", "Semi"], ["700", "Bold"], ["900", "Black"]]} value={String(theme.nameWeight)} onChange={(value) => update({ nameWeight: Number(value) as StoreTheme["nameWeight"] })} />
          <Segment values={[["none", "normal"], ["uppercase", "MAIÚSCULA"], ["lowercase", "minúscula"]]} value={theme.nameTransform} onChange={(value) => update({ nameTransform: value as StoreTheme["nameTransform"] })} />
          <Segment values={[["normal", "normal"], ["wide", "espaçado"], ["wider", "muito espaçado"]]} value={theme.nameLetterSpacing} onChange={(value) => update({ nameLetterSpacing: value as StoreTheme["nameLetterSpacing"] })} />
        </Field>
      </Accordion>

      <Accordion id="avatar" title="Avatar" meta={<span className="grid size-7 place-items-center rounded-full text-xs text-white" style={{ background: theme.accentColor }}>AF</span>} open={open} setOpen={setOpen}>
        <Segment values={[["circle", "Círculo"], ["square", "Quadrado"], ["rounded", "Arred."], ["hexagon", "Hex."]]} value={theme.avatarShape} onChange={(value) => update({ avatarShape: value as StoreTheme["avatarShape"] })} />
        <Segment values={[["sm", "P"], ["md", "M"], ["lg", "G"]]} value={theme.avatarSize} onChange={(value) => update({ avatarSize: value as StoreTheme["avatarSize"] })} />
        <Segment values={[["0", "0"], ["2", "2px"], ["4", "4px"]]} value={String(theme.avatarBorderWidth)} onChange={(value) => update({ avatarBorderWidth: Number(value) as StoreTheme["avatarBorderWidth"] })} />
        <button type="button" onClick={() => update({ avatarBorderColor: theme.accentColor })} className="text-left text-sm font-bold text-[#FF4D6D]">Usar cor de destaque na borda</button>
        <Toggle label="Sombra" checked={theme.avatarShadow} onChange={(checked) => update({ avatarShadow: checked })} />
      </Accordion>

      <Accordion id="products" title="Produtos" meta={<span className="h-7 w-10 rounded bg-[var(--bg-elevated)]" />} open={open} setOpen={setOpen}>
        <Segment values={[["cover-top", "Vertical"], ["cover-left", "Esq.Img"], ["cover-right", "Dir.Img"], ["text-only", "Só texto"]]} value={theme.cardLayout} onChange={(value) => update({ cardLayout: value as StoreTheme["cardLayout"] })} />
        <Segment values={[["grid1", "1 coluna"], ["grid2", "2 colunas"], ["list", "Lista"]]} value={theme.storeLayout} onChange={(value) => update({ storeLayout: value as StoreTheme["storeLayout"] })} />
        <Segment values={[["sm", "Baixa"], ["md", "Média"], ["lg", "Alta"]]} value={theme.coverHeight} onChange={(value) => update({ coverHeight: value as StoreTheme["coverHeight"] })} />
        <Segment values={[["none", "0"], ["sm", "8"], ["md", "16"], ["lg", "20"], ["xl", "28"]]} value={theme.cardBorderRadius} onChange={(value) => update({ cardBorderRadius: value as StoreTheme["cardBorderRadius"] })} />
        <Segment values={[["0", "Sem"], ["1", "1px"], ["2", "2px"]]} value={String(theme.cardBorderWidth)} onChange={(value) => update({ cardBorderWidth: Number(value) as StoreTheme["cardBorderWidth"] })} />
        <input className="input-base" value={theme.cardBorderColor} onChange={(event) => update({ cardBorderColor: event.target.value })} />
        <Segment values={[["none", "Sem"], ["sm", "Suave"], ["md", "Média"], ["lg", "Forte"]]} value={theme.cardShadow} onChange={(value) => update({ cardShadow: value as StoreTheme["cardShadow"] })} />
        <Toggle label="Mostrar descrição" checked={theme.showProductDescription} onChange={(checked) => update({ showProductDescription: checked })} />
        <Toggle label="Mostrar avaliação inline" checked={theme.showProductRating} onChange={(checked) => update({ showProductRating: checked })} />
      </Accordion>

      <Accordion id="buttons" title="Botões" meta={<span className="rounded-full bg-[#FF4D6D] px-3 py-1 text-xs text-white">Comprar</span>} open={open} setOpen={setOpen}>
        <Segment values={[["filled", "Preenchido"], ["outline", "Outline"], ["ghost", "Ghost"], ["underline", "Sublinhado"]]} value={theme.buttonStyle} onChange={(value) => update({ buttonStyle: value as StoreTheme["buttonStyle"] })} />
        <Segment values={[["none", "0"], ["sm", "Leve"], ["md", "Médio"], ["lg", "Arred."], ["pill", "Pill"]]} value={theme.buttonRadius} onChange={(value) => update({ buttonRadius: value as StoreTheme["buttonRadius"] })} />
        <Segment values={[["sm", "P"], ["md", "M"], ["lg", "G"]]} value={theme.buttonSize} onChange={(value) => update({ buttonSize: value as StoreTheme["buttonSize"] })} />
        <Segment values={[["none", "normal"], ["uppercase", "MAIÚSCULA"]]} value={theme.buttonTransform} onChange={(value) => update({ buttonTransform: value as StoreTheme["buttonTransform"] })} />
        <Segment values={[["400", "Regular"], ["600", "Semi"], ["700", "Bold"], ["900", "Black"]]} value={String(theme.buttonWeight)} onChange={(value) => update({ buttonWeight: Number(value) as StoreTheme["buttonWeight"] })} />
      </Accordion>

      <Accordion id="links" title="Links sociais" meta={<span className="text-sm">•••</span>} open={open} setOpen={setOpen}>
        <Segment values={[["pill", "Pills"], ["icon-only", "Ícones"], ["text-only", "Texto"], ["button", "Botões"]]} value={theme.linkStyle} onChange={(value) => update({ linkStyle: value as StoreTheme["linkStyle"] })} />
        <Segment values={[["sm", "P"], ["md", "M"], ["lg", "G"]]} value={theme.linkSize} onChange={(value) => update({ linkSize: value as StoreTheme["linkSize"] })} />
      </Accordion>

      <Accordion id="separator" title="Separador" meta={<span className="block h-px w-10 bg-[#FF4D6D]" />} open={open} setOpen={setOpen}>
        <Segment values={[["none", "Nenhum"], ["line", "Linha"], ["dots", "Pontos"], ["accent-line", "Accent"]]} value={theme.separatorStyle} onChange={(value) => update({ separatorStyle: value as StoreTheme["separatorStyle"] })} />
        <Segment values={[["short", "Curto"], ["medium", "Médio"], ["full", "Completo"]]} value={theme.separatorWidth} onChange={(value) => update({ separatorWidth: value as StoreTheme["separatorWidth"] })} />
      </Accordion>
    </div>
  );
}

function Accordion({ id, title, meta, open, setOpen, children }: { id: string; title: string; meta: React.ReactNode; open: string; setOpen: (id: string) => void; children: React.ReactNode }) {
  const active = open === id;
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <button type="button" onClick={() => setOpen(active ? "" : id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="font-heading text-sm font-bold text-[var(--text-primary)]">{title}</span>
        <span className="ml-auto text-[var(--text-secondary)]">{meta}</span>
        <ChevronDown className={`transition ${active ? "rotate-180" : ""}`} size={17} />
      </button>
      {active && <div className="grid gap-5 border-t border-[var(--border-subtle)] p-4">{children}</div>}
    </section>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="grid gap-3"><p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>{children}</div>;
}

function Segment({ values, value, onChange }: { values: Array<[string, string]>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={`min-h-10 rounded-[10px] border px-3 text-sm font-bold ${value === id ? "border-[#FF4D6D] bg-[#FF4D6D] text-white" : "border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Swatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="size-9 rounded-full border-2" style={{ background: color, borderColor: selected ? "#fff" : "transparent" }} aria-label={color} />;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] p-3 text-sm font-bold">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[#FF4D6D]" />
    </label>
  );
}

function FontGrid({ title, fonts, selected, onSelect }: { title: string; fonts: FontOption[]; selected: FontOption; onSelect: (font: FontOption) => void }) {
  return (
    <Field title={title}>
      <div className="grid grid-cols-2 gap-2">
        {fonts.map((font) => (
          <button key={font} type="button" onClick={() => onSelect(font)} className={`h-12 rounded-xl border text-center text-sm font-bold ${selected === font ? "border-[#FF4D6D] bg-[#FF4D6D]/10" : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"}`} style={{ fontFamily: font }}>
            {font}
          </button>
        ))}
      </div>
    </Field>
  );
}

function ColorDots({ theme }: { theme: StoreTheme }) {
  return (
    <span className="flex gap-1">
      {[theme.accentColor, theme.backgroundColor, theme.surfaceColor, theme.textPrimaryColor].map((color) => <span key={color} className="size-3 rounded-full border border-white/20" style={{ background: color }} />)}
    </span>
  );
}

function presetBackground(id: TemplateId) {
  if (id === "glass") return "linear-gradient(135deg, #0f0f1a, #1a0f2e)";
  if (id === "bold") return "#000000";
  if (id === "magazine") return "#FAFAF8";
  if (id === "retro") return "#FFF8E7";
  if (id === "soft") return "#FFF0EC";
  if (id === "cleanpro") return "#FAFAFA";
  if (id === "cards") return "#0a0a0a";
  return "#080808";
}

function PresetVisual({ id, accent }: { id: TemplateId; accent: string }) {
  if (id === "minimal") {
    return (
      <div className="grid h-full place-items-center px-7 py-4">
        <div className="grid w-full justify-items-center gap-3">
          <span className="size-4 rounded-full" style={{ background: accent }} />
          {[40, 36, 32].map((width) => (
            <span key={width} className="flex w-full items-center gap-2">
              <span className="size-2 rounded bg-white/10" />
              <span className="h-2 rounded bg-white/10" style={{ width }} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (id === "cards") {
    return (
      <div className="grid h-full place-items-center py-4">
        <div className="grid justify-items-center gap-3">
          <span className="size-3.5 rounded-full" style={{ background: accent }} />
          <div className="grid grid-cols-2 gap-1.5">
            {["linear-gradient(135deg,#FF4D6D,#FF2D55)", "linear-gradient(135deg,#10B981,#064E3B)", "linear-gradient(135deg,#06B6D4,#1E3A8A)", "linear-gradient(135deg,#F59E0B,#B45309)"].map((bg) => (
              <span key={bg} className="h-7 w-6 rounded-md" style={{ background: bg }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (id === "glass") {
    return (
      <div className="grid h-full place-items-center px-6 py-4">
        <div className="grid w-full justify-items-center gap-3">
          <span className="size-3.5 rounded-full border border-white/30 bg-white/10" />
          <div className="grid w-full grid-cols-2 gap-2">
            <span className="h-9 rounded-lg border border-white/15 bg-white/[0.08]" />
            <span className="h-9 rounded-lg border border-white/15 bg-white/[0.08]" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "bold") {
    return (
      <div className="grid h-full content-center gap-2 px-5 py-4">
        <span className="size-4 border-2 border-white" />
        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-white">ANA FITNESS</span>
        <span className="h-px w-full bg-white" />
        <span className="h-4 w-full border border-[#333]" />
        <span className="h-4 w-4/5 border border-[#333]" />
      </div>
    );
  }

  if (id === "magazine") {
    return (
      <div className="grid h-full content-center gap-3 px-5 py-4 text-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#1a1a1a]" />
          <span className="h-1.5 w-16 rounded bg-black/20" />
        </div>
        {[1, 2, 3].map((item) => (
          <span key={item} className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-black/35">0{item}</span>
            <span className="h-1.5 flex-1 rounded bg-black/18" />
          </span>
        ))}
      </div>
    );
  }

  if (id === "retro") {
    return (
      <div className="grid h-full place-items-center px-6 py-4">
        <div className="grid w-full justify-items-center gap-3">
          <span className="size-4 rounded-full border-2 border-black bg-[#FF6B2B] shadow-[2px_2px_0_#000]" />
          <div className="grid w-full grid-cols-2 gap-2">
            <span className="h-9 rounded border-2 border-black bg-[#FFB000] shadow-[3px_3px_0_#000]" />
            <span className="h-9 rounded border-2 border-black bg-[#FF6B2B] shadow-[3px_3px_0_#000]" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "soft") {
    return (
      <div className="grid h-full place-items-center px-6 py-4">
        <div className="grid w-full justify-items-center gap-3">
          <span className="size-5 rounded-full border-[3px] border-[#FF7A5C] bg-white" />
          <div className="grid w-full grid-cols-2 gap-2">
            <span className="h-10 rounded-[14px] bg-[#FFD8CC] shadow-[0_6px_16px_rgba(0,0,0,0.08)]" />
            <span className="h-10 rounded-[14px] bg-[#FFE7DF] shadow-[0_6px_16px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full content-center gap-3 px-6 py-4">
      <span className="size-3 rounded-full border border-gray-300 bg-white" />
      {[0, 1, 2].map((item) => (
        <span key={item} className="grid gap-2">
          <span className="h-px w-full bg-gray-200" />
          <span className="h-1.5 w-2/3 rounded bg-gray-300" />
        </span>
      ))}
    </div>
  );
}

