"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileText, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import ProductPageSections from "@/components/store/ProductPageSections";
import Toast from "@/components/ui/Toast";
import { mapApiProduct } from "@/lib/api-mappers";
import { uploadSignedCloudinaryImage, validateImageFile } from "@/lib/client/cloudinary-upload";
import { buildDefaultProductPageSections, createProductPageSection, SECTION_LABELS, SECTION_TYPES, type ProductPageSection, type ProductPageSectionType } from "@/lib/product-page-sections";
import { THEME_PRESETS } from "@/lib/theme-presets";
import type { Product } from "@/lib/types";
import type { StoreTheme } from "@/lib/theme";

type ProductPageBuilderProps = {
  productId: string;
};

type CreatorRow = {
  username?: string;
  store_theme?: StoreTheme;
};

export default function ProductPageBuilder({ productId }: ProductPageBuilderProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [theme, setTheme] = useState<StoreTheme>(THEME_PRESETS.cards);
  const [sections, setSections] = useState<ProductPageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [mobileView, setMobileView] = useState<"list" | "editor" | "preview">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [productResponse, creatorResponse] = await Promise.all([
          fetch(`/api/products/${productId}`, { credentials: "include", cache: "no-store" }),
          fetch("/api/creators/me", { credentials: "include", cache: "no-store" }),
        ]);
        const productPayload = await productResponse.json();
        const creatorPayload = await creatorResponse.json();
        if (!productResponse.ok) throw new Error(productPayload.error ?? "Produto nao encontrado");
        const mapped = mapApiProduct(productPayload.data);
        const initialSections = mapped.pageSections?.length ? mapped.pageSections : seedDefaultSections(mapped);
        setProduct(mapped);
        setSections(initialSections);
        setSelectedId(initialSections[0]?.id ?? null);
        const creator = (creatorPayload.data ?? {}) as CreatorRow;
        setTheme(creator.store_theme ?? THEME_PRESETS.cards);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Erro ao carregar pagina do produto.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const selected = useMemo(() => sections.find((section) => section.id === selectedId) ?? null, [sections, selectedId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function updateSection(next: ProductPageSection) {
    setSections((current) => current.map((section) => section.id === next.id ? next : section));
  }

  function addSection(type: ProductPageSectionType) {
    const section = createProductPageSection(type);
    setSections((current) => [...current, section]);
    setSelectedId(section.id);
    setAddOpen(false);
    setMode("edit");
    setMobileView("editor");
  }

  function selectSection(id: string) {
    setSelectedId(id);
    setMobileView("editor");
  }

  function selectPreviewSection(id: string) {
    setSelectedId(id);
    const section = sections.find((item) => item.id === id);
    if (section && section.type !== "heading" && section.type !== "paragraph" && section.type !== "quote") {
      setMobileView("editor");
    }
  }

  function moveSection(id: string, direction: -1 | 1) {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeSection(id: string) {
    setSections((current) => current.filter((section) => section.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function save() {
    if (!product) return;
    setSaving(true);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_sections: sections }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(payload.error ?? "Erro ao salvar pagina.");
      return;
    }
    const mapped = mapApiProduct(payload.data);
    setProduct(mapped);
    setSections(mapped.pageSections ?? []);
    showToast("Pagina do produto salva.");
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] text-sm text-[var(--text-secondary)]">Carregando construtor...</div>;
  }

  if (!product) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] p-6 text-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Produto nao encontrado</h1>
          <Link href="/dashboard/infoprodutos/produtos"><Button className="mt-4">Voltar</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/infoprodutos/produtos" className="grid size-10 place-items-center rounded-[10px] border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)]">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Pagina do produto</p>
            <h1 className="truncate font-heading text-lg font-bold">{product.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobileView("preview")} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] px-3 text-sm font-bold text-[var(--text-secondary)] md:hidden">
            <Eye size={15} />
            Visualizar
          </button>
          <div className="hidden rounded-[10px] border border-[var(--border-subtle)] p-1 sm:flex">
            <button type="button" onClick={() => setMode("edit")} className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-bold ${mode === "edit" ? "bg-[#FF4D6D] text-white" : "text-[var(--text-secondary)]"}`}>
              <Pencil size={15} /> Editar
            </button>
            <button type="button" onClick={() => setMode("preview")} className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-bold ${mode === "preview" ? "bg-[#FF4D6D] text-white" : "text-[var(--text-secondary)]"}`}>
              <Eye size={15} /> Visualizar
            </button>
          </div>
          <Button loading={saving} onClick={save}><Save size={16} />Salvar</Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_380px]">
        <aside className={`${mobileView === "list" ? "block" : "hidden"} ${mode === "preview" ? "lg:hidden" : "lg:block"} min-h-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4`}>
          <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 lg:static lg:m-0 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="grid grid-cols-2 gap-2 lg:block">
              <Button className="w-full" onClick={() => setAddOpen(true)}><Plus size={16} />Adicionar secao</Button>
              <Button variant="secondary" className="w-full lg:hidden" onClick={() => setMobileView("preview")}><Eye size={16} />Previa</Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {sections.length ? sections.map((section, index) => (
              <Card key={section.id} className={`p-3 transition ${selectedId === section.id ? "ring-2 ring-[#FF4D6D]" : ""}`}>
                <button type="button" onClick={() => selectSection(section.id)} className="min-h-12 w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[#FF4D6D]"><FileText size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{SECTION_LABELS[section.type]}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">{sectionSummary(section)}</p>
                    </div>
                  </div>
                </button>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <IconButton label="Mover para cima" disabled={index === 0} onClick={() => moveSection(section.id, -1)}><ArrowUp size={15} /></IconButton>
                  <IconButton label="Mover para baixo" disabled={index === sections.length - 1} onClick={() => moveSection(section.id, 1)}><ArrowDown size={15} /></IconButton>
                  <IconButton label="Editar" onClick={() => selectSection(section.id)}><Pencil size={15} /></IconButton>
                  <IconButton label="Remover" onClick={() => removeSection(section.id)}><Trash2 size={15} /></IconButton>
                </div>
              </Card>
            )) : (
              <div className="rounded-[12px] border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-secondary)]">
                Nenhuma secao personalizada. A loja usa o fallback padrao ate voce salvar uma estrutura.
              </div>
            )}
          </div>
        </aside>

        <main className={`${mobileView === "preview" ? "block" : "hidden"} ${mode === "edit" ? "lg:block" : "lg:block"} min-h-0 overflow-y-auto p-4 lg:p-8`} style={{ background: theme.backgroundColor }}>
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border px-3 text-sm font-bold shadow-sm backdrop-blur"
              style={{
                background: theme.surfaceColor,
                borderColor: theme.cardBorderColor,
                color: theme.textPrimaryColor,
              }}
            >
              <ArrowLeft size={16} />
              Voltar para edicao
            </button>
          </div>
          <div className="mx-auto w-full max-w-[760px] rounded-[24px] border p-5 shadow-2xl" style={{ background: theme.backgroundColor, borderColor: theme.cardBorderColor, color: theme.textPrimaryColor }}>
            <ProductPageSections
              product={{ ...product, pageSections: sections }}
              theme={theme}
              sections={sections}
              onBuy={() => showToast("Preview: o checkout abre na pagina publica.")}
              editable
              selectedSectionId={selectedId}
              onSelectSection={selectPreviewSection}
              onInlineChange={updateSection}
            />
          </div>
        </main>

        <aside className={`${mobileView === "editor" ? "block" : "hidden"} ${mode === "preview" ? "lg:hidden" : "lg:block"} min-h-0 overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4`}>
          <div className="mb-4 lg:hidden">
            <button type="button" onClick={() => setMobileView("list")} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] px-3 text-sm font-bold text-[var(--text-secondary)]">
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
          {selected ? (
            <SectionEditor section={selected} onChange={updateSection} />
          ) : (
            <div className="grid min-h-60 place-items-center rounded-[12px] border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-secondary)]">
              Selecione uma secao para editar ou adicione uma nova.
            </div>
          )}
        </aside>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
          <div className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-bold">Adicionar secao</h2>
              <button type="button" onClick={() => setAddOpen(false)} className="grid size-9 place-items-center rounded-[10px] hover:bg-[var(--bg-elevated)]"><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_TYPES.map((type) => (
                <button key={type} type="button" onClick={() => addSection(type)} className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 text-left transition hover:-translate-y-1 hover:border-[#FF4D6D]">
                  <div className="grid size-10 place-items-center rounded-[10px] bg-[#FF4D6D]/10 text-[#FF4D6D]"><FileText size={18} /></div>
                  <p className="mt-3 font-bold">{SECTION_LABELS[type]}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{sectionTypeHint(type)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}

function SectionEditor({ section, onChange }: { section: ProductPageSection; onChange: (section: ProductPageSection) => void }) {
  function setData(data: ProductPageSection["data"]) {
    onChange({ ...section, data } as ProductPageSection);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Editando</p>
        <h2 className="font-heading text-xl font-bold">{SECTION_LABELS[section.type]}</h2>
      </div>
      {renderEditor(section, setData)}
    </div>
  );
}

function renderEditor(section: ProductPageSection, setData: (data: ProductPageSection["data"]) => void) {
  switch (section.type) {
    case "heading":
      return (
        <>
          <Input label="Texto" value={section.data.text} onChange={(event) => setData({ ...section.data, text: event.target.value })} />
          <Select label="Tamanho" value={section.data.size} options={[["large", "Grande"], ["medium", "Medio"]]} onChange={(value) => setData({ ...section.data, size: value as "large" | "medium" })} />
        </>
      );
    case "paragraph":
      return <Textarea label="Conteudo HTML" value={section.data.content} onChange={(event) => setData({ content: event.target.value })} className="min-h-48" />;
    case "quote":
      return <Textarea label="Frase" value={section.data.text} onChange={(event) => setData({ text: event.target.value })} />;
    case "checklist":
      return <StringList label="Itens" items={section.data.items} onChange={(items) => setData({ items })} />;
    case "faq":
      return <PairList label="Perguntas" items={section.data.items} firstLabel="Pergunta" secondLabel="Resposta" firstKey="question" secondKey="answer" onChange={(items) => setData({ items })} />;
    case "image":
      return <ImageField label="Imagem" value={section.data.url} onChange={(url) => setData({ url })} />;
    case "image_text":
      return (
        <>
          <ImageField label="Imagem" value={section.data.url} onChange={(url) => setData({ ...section.data, url })} />
          <Input label="Titulo" value={section.data.heading} onChange={(event) => setData({ ...section.data, heading: event.target.value })} />
          <Textarea label="Texto" value={section.data.text} onChange={(event) => setData({ ...section.data, text: event.target.value })} />
          <Select label="Lado da imagem" value={section.data.side} options={[["left", "Esquerda"], ["right", "Direita"]]} onChange={(value) => setData({ ...section.data, side: value as "left" | "right" })} />
        </>
      );
    case "video":
      return <Input label="URL do video" value={section.data.url} onChange={(event) => setData({ url: event.target.value })} />;
    case "gallery":
      return <StringList label="URLs das imagens" items={section.data.images} onChange={(images) => setData({ images })} uploadImages />;
    case "testimonials":
      return <TestimonialList items={section.data.items} onChange={(items) => setData({ items })} />;
    case "stats":
      return <PairList label="Numeros" items={section.data.items} firstLabel="Valor" secondLabel="Rotulo" firstKey="value" secondKey="label" onChange={(items) => setData({ items })} />;
    case "table":
      return <TableEditor headers={section.data.headers} rows={section.data.rows} onChange={(data) => setData(data)} />;
    case "divider":
      return <p className="text-sm text-[var(--text-secondary)]">Esta secao nao tem campos.</p>;
    case "spacer":
      return <Select label="Espaco" value={section.data.size} options={[["small", "Pequeno"], ["medium", "Medio"], ["large", "Grande"]]} onChange={(value) => setData({ size: value as "small" | "medium" | "large" })} />;
    case "columns":
      return <ColumnList items={section.data.items} onChange={(items) => setData({ items })} />;
    case "cta_button":
      return (
        <>
          <Input label="Texto do botao" value={section.data.label} onChange={(event) => setData({ ...section.data, label: event.target.value })} />
          <Input label="URL externa opcional" value={section.data.url ?? ""} onChange={(event) => setData({ ...section.data, url: event.target.value })} />
          <Select label="Estilo" value={section.data.style} options={[["primary", "Primario"], ["secondary", "Secundario"]]} onChange={(value) => setData({ ...section.data, style: value as "primary" | "secondary" })} />
        </>
      );
    case "buy_button":
      return <p className="text-sm text-[var(--text-secondary)]">Usa sempre o produto, preco e checkout atuais. Pode aparecer de 1 a 5 vezes.</p>;
  }
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-10 place-items-center rounded-[10px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30">
      {children}
    </button>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-base">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function StringList({ label, items, onChange, uploadImages = false }: { label: string; items: string[]; onChange: (items: string[]) => void; uploadImages?: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">{label}</p>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input value={item} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} />
          <IconButton label="Remover" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></IconButton>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onChange([...items, ""])}><Plus size={16} />Adicionar</Button>
        {uploadImages && <UploadButton onUploaded={(url) => onChange([...items, url])} />}
      </div>
    </div>
  );
}

function PairList<T extends Record<string, string>>({ label, items, firstLabel, secondLabel, firstKey, secondKey, onChange }: { label: string; items: T[]; firstLabel: string; secondLabel: string; firstKey: keyof T; secondKey: keyof T; onChange: (items: T[]) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">{label}</p>
      {items.map((item, index) => (
        <Card key={index} className="space-y-3 p-3">
          <Input label={firstLabel} value={item[firstKey] ?? ""} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, [firstKey]: event.target.value } : value))} />
          <Textarea label={secondLabel} value={item[secondKey] ?? ""} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, [secondKey]: event.target.value } : value))} />
          <Button variant="ghost" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} />Remover</Button>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { [firstKey]: "", [secondKey]: "" } as T])}><Plus size={16} />Adicionar</Button>
    </div>
  );
}

function TestimonialList({ items, onChange }: { items: Array<{ name: string; text: string; avatar_url?: string }>; onChange: (items: Array<{ name: string; text: string; avatar_url?: string }>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Depoimentos</p>
      {items.map((item, index) => (
        <Card key={index} className="space-y-3 p-3">
          <Input label="Nome" value={item.name} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, name: event.target.value } : value))} />
          <Textarea label="Texto" value={item.text} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, text: event.target.value } : value))} />
          <ImageField label="Avatar opcional" value={item.avatar_url ?? ""} onChange={(url) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, avatar_url: url } : value))} />
          <Button variant="ghost" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} />Remover</Button>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { name: "", text: "", avatar_url: "" }])}><Plus size={16} />Adicionar</Button>
    </div>
  );
}

function ColumnList({ items, onChange }: { items: Array<{ icon: string; title: string; text: string }>; onChange: (items: Array<{ icon: string; title: string; text: string }>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Colunas</p>
      {items.map((item, index) => (
        <Card key={index} className="space-y-3 p-3">
          <Input label="Icone (check, star, bolt ou texto)" value={item.icon} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, icon: event.target.value } : value))} />
          <Input label="Titulo" value={item.title} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, title: event.target.value } : value))} />
          <Textarea label="Texto" value={item.text} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, text: event.target.value } : value))} />
          <Button variant="ghost" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} />Remover</Button>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { icon: "check", title: "", text: "" }])}><Plus size={16} />Adicionar</Button>
    </div>
  );
}

function TableEditor({ headers, rows, onChange }: { headers: string[]; rows: string[][]; onChange: (data: { headers: string[]; rows: string[][] }) => void }) {
  return (
    <div className="space-y-4">
      <StringList label="Cabecalhos" items={headers} onChange={(nextHeaders) => onChange({ headers: nextHeaders, rows })} />
      <div className="space-y-3">
        <p className="text-sm font-bold">Linhas</p>
        {rows.map((row, rowIndex) => (
          <Card key={rowIndex} className="space-y-2 p-3">
            {headers.map((header, cellIndex) => (
              <Input key={cellIndex} label={header || `Coluna ${cellIndex + 1}`} value={row[cellIndex] ?? ""} onChange={(event) => onChange({ headers, rows: rows.map((value, index) => index === rowIndex ? headers.map((_, nextCell) => nextCell === cellIndex ? event.target.value : value[nextCell] ?? "") : value) })} />
            ))}
            <Button variant="ghost" onClick={() => onChange({ headers, rows: rows.filter((_, index) => index !== rowIndex) })}><Trash2 size={16} />Remover linha</Button>
          </Card>
        ))}
        <Button variant="secondary" onClick={() => onChange({ headers, rows: [...rows, headers.map(() => "")] })}><Plus size={16} />Adicionar linha</Button>
      </div>
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  return (
    <div className="space-y-3">
      <Input label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
      <UploadButton onUploaded={onChange} />
    </div>
  );
}

function UploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function onFile(file?: File) {
    if (!file) return;
    const validation = validateImageFile(file, 5 * 1024 * 1024);
    if (validation) {
      setError(validation);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadSignedCloudinaryImage({ file, uploadType: "product_image", productKind: "digital" });
      onUploaded(uploaded.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border-subtle)] px-4 text-sm font-semibold transition hover:bg-[var(--bg-elevated)]">
      <Upload size={16} />
      {uploading ? "Enviando..." : "Enviar imagem"}
      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(event) => onFile(event.target.files?.[0])} />
      {error && <span className="sr-only">{error}</span>}
    </label>
  );
}

function sectionSummary(section: ProductPageSection) {
  switch (section.type) {
    case "heading": return section.data.text;
    case "paragraph": return section.data.content.replace(/<[^>]+>/g, "");
    case "quote": return section.data.text.replace(/<[^>]+>/g, "");
    case "checklist": return `${section.data.items.length} itens`;
    case "faq": return `${section.data.items.length} perguntas`;
    case "image": return section.data.url || "Imagem vazia";
    case "image_text": return section.data.heading || "Imagem + texto";
    case "video": return section.data.url || "Video vazio";
    case "gallery": return `${section.data.images.length} imagens`;
    case "testimonials": return `${section.data.items.length} depoimentos`;
    case "stats": return `${section.data.items.length} numeros`;
    case "table": return `${section.data.rows.length} linhas`;
    case "divider": return "Linha divisoria";
    case "spacer": return section.data.size;
    case "columns": return `${section.data.items.length} colunas`;
    case "cta_button": return section.data.label;
    case "buy_button": return "Checkout real";
  }
}

function seedDefaultSections(product: Product) {
  return buildDefaultProductPageSections(product).map((section) => ({
    ...section,
    id: makeSectionId(),
  }));
}

function makeSectionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

function sectionTypeHint(type: ProductPageSectionType) {
  const hints: Record<ProductPageSectionType, string> = {
    heading: "Titulo grande ou medio.",
    paragraph: "Texto com HTML sanitizado.",
    quote: "Frase de impacto.",
    checklist: "Lista de beneficios.",
    faq: "Perguntas e respostas.",
    image: "Imagem unica.",
    image_text: "Imagem ao lado de texto.",
    video: "Embed de video.",
    gallery: "Varias imagens.",
    testimonials: "Depoimentos de clientes.",
    stats: "Indicadores e numeros.",
    table: "Comparativos simples.",
    divider: "Separador visual.",
    spacer: "Respiro entre secoes.",
    columns: "Cards em duas colunas.",
    cta_button: "Botao generico.",
    buy_button: "Botao real de compra.",
  };
  return hints[type];
}
