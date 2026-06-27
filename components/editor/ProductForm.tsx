"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  Check,
  Edit2,
  GripVertical,
  Italic,
  List,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PRODUCT_GRADIENTS, PRODUCT_TYPE_IDS, PRODUCT_TYPES } from "@/lib/product-types";
import { uploadSignedCloudinaryImage, validateImageFile } from "@/lib/client/cloudinary-upload";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import type { Product, ProductStatus, ProductType, Review } from "@/lib/types";
import { formatPrice, normalizeCurrencyInput } from "@/lib/utils";

function canUseOptimizedImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

type ProductFormProps = {
  initialProduct?: Product;
  products?: Product[];
  mode?: "create" | "edit";
  productKind?: "digital" | "physical";
  lockedKind?: boolean;
  onCancel: () => void;
  onSave: (product: Product) => void | Promise<void>;
  onSuccess?: (product: Product) => void;
  redirectTo?: string;
};

const steps = ["Tipo", "Conteúdo", "Precificação", "Entrega"];

const includeSuggestions: Record<ProductType, string[]> = {
  infoproduto: ["Acesso imediato", "Entrega automatica", "Suporte por email"],
  fisico: ["Produto embalado", "Envio acompanhado", "Suporte pos-venda"],
  ebook: ["PDF com X páginas", "Acesso vitalício", "Atualizações gratuitas"],
  planilha: ["Arquivo editável", "Instruções de uso", "Suporte por email"],
  template: ["Arquivo editável", "Tutorial em vídeo", "Acesso ao Canva/Notion"],
  curso: ["X aulas em vídeo", "Material de apoio PDF", "Certificado de conclusão"],
  mentoria: ["X hora de sessão", "Gravação da chamada", "Plano de ação em PDF"],
  pack: ["X arquivos inclusos", "Licença comercial", "Atualizações inclusas"],
  comunidade: ["Acesso ao grupo exclusivo", "Conteúdo novo toda semana", "Encontros mensais"],
};

const placeholders: Record<ProductType, string> = {
  infoproduto: "Ex: Metodo Completo para Criadores",
  fisico: "Ex: Planner Impresso Pikbio",
  ebook: "Ex: Guia Completo de Emagrecimento",
  planilha: "Ex: Planilha de Treino 12 semanas",
  template: "Ex: Template de Planner Notion",
  curso: "Ex: Mini-curso de Reels que Vendem",
  mentoria: "Ex: Mentoria 1h para Criadores",
  pack: "Ex: Pack de Presets Profissionais",
  comunidade: "Ex: Comunidade VIP de Alunas",
};

const reviewAvatarColors = ["#FF4D6D", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B"];
const visibleProductTypeIds = PRODUCT_TYPE_IDS.filter((type) => FEATURE_PHYSICAL_PRODUCT || type !== "fisico");

const reviewSuggestions: Record<ProductType, string[]> = {
  infoproduto: [
    "O conteudo e direto ao ponto e me ajudou a aplicar sem ficar perdido.",
    "Gostei porque nao parece material generico. Tem exemplos reais e ficou facil usar.",
    "Comprei sem muita expectativa e me surpreendi. O produto e claro e bem organizado.",
  ],
  fisico: [
    "O produto chegou bem embalado e a qualidade superou minhas expectativas.",
    "Gostei do acabamento e do cuidado na entrega. Compraria de novo.",
    "Produto exatamente como anunciado, com entrega organizada e bom atendimento.",
  ],
  ebook: [
    "O guia e direto ao ponto e me ajudou a organizar a alimentacao sem ficar perdida. Muito pratico.",
    "Gostei porque nao parece material generico. Tem exemplos reais e ficou facil aplicar na rotina.",
    "Comprei sem muita expectativa e me surpreendi. O conteudo e claro e bem dividido.",
  ],
  planilha: [
    "Ja testei varias planilhas de treino e essa e de longe a mais completa. Facil de usar e com progressao real.",
    "Perfeita para quem treina em casa. Me ajudou muito a manter a consistencia nos ultimos 3 meses.",
    "A planilha e organizada, simples de preencher e me deu clareza do que fazer em cada semana.",
  ],
  template: [
    "Economizei horas montando tudo do zero. O template ficou bonito e muito facil de editar.",
    "Usei no Canva e consegui deixar com a minha identidade em poucos minutos.",
    "O tutorial junto fez muita diferenca. Consegui aplicar mesmo sem experiencia com design.",
  ],
  curso: [
    "As aulas sao curtas e objetivas. Consegui assistir e aplicar no mesmo dia.",
    "Gostei da organizacao por modulos. O curso tira a sensacao de estar perdida.",
    "Conteudo pratico, sem enrolacao, com exemplos que fazem sentido para quem esta comecando.",
  ],
  mentoria: [
    "A chamada foi muito clara e sai com um plano de acao realista para seguir na semana.",
    "Valeu muito pela analise individual. Ela enxergou pontos que eu nao tinha percebido.",
    "Gostei da objetividade e do resumo depois da sessao. Ficou facil executar.",
  ],
  pack: [
    "O pack veio muito completo e com arquivos bem organizados. Ja usei em varias campanhas.",
    "A qualidade dos materiais surpreendeu. Economizou muito tempo na criacao dos posts.",
    "Comprei para testar e acabei usando quase tudo. Muito melhor que packs soltos da internet.",
  ],
  comunidade: [
    "A comunidade e ativa e tem conteudo util toda semana. Nao e so mais um grupo parado.",
    "Gostei do suporte e da troca com outras pessoas. Me ajudou a manter consistencia.",
    "O valor compensa pelo acompanhamento e pelas ideias que aparecem no grupo.",
  ],
};

function createDraft(type: ProductType = "infoproduto", initial?: Product): Product {
  const meta = PRODUCT_TYPES[type];
  return {
    id: "",
    name: "",
    price: 0,
    type,
    coverColor: meta.color,
    coverGradient: meta.gradient,
    description: "",
    shortDescription: "",
    includes: includeSuggestions[type].slice(0, 2),
    reviews: [],
    active: true,
    status: "active",
    billingType: "one_time",
    deliveryMessage: "Olá {nome}! Seu {produto} está pronto. Clique aqui para acessar: {link}",
    thankYouMessage: "Obrigado pela compra! Verifique seu email.",
    modules: [{ id: "mod-1", name: "Módulo 1: Fundamentos", lessons: 4 }],
    ...initial,
  };
}

export default function ProductForm({ initialProduct, products = [], productKind, lockedKind = false, onCancel, onSave }: ProductFormProps) {
  const forcedType: ProductType | undefined = productKind === "physical" && FEATURE_PHYSICAL_PRODUCT ? "fisico" : productKind === "digital" ? "infoproduto" : undefined;
  const [step, setStep] = useState(initialProduct || lockedKind ? 1 : 0);
  const [draft, setDraft] = useState<Product>(createDraft(initialProduct?.type ?? forcedType ?? "infoproduto", initialProduct));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const meta = PRODUCT_TYPES[draft.type];
  const netValue = Math.round((draft.price || 0) * 0.9);
  const discount = useMemo(() => {
    if (!draft.originalPrice || !draft.price || draft.originalPrice <= draft.price) return null;
    return Math.round(((draft.originalPrice - draft.price) / draft.originalPrice) * 100);
  }, [draft.originalPrice, draft.price]);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectType(type: ProductType) {
    setDraft(createDraft(type, { ...draft, type, coverColor: PRODUCT_TYPES[type].color, coverGradient: PRODUCT_TYPES[type].gradient }));
    setStep(1);
  }

  function validate(currentStep = step) {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!draft.name.trim()) nextErrors.name = "Informe o nome do produto.";
      if (!draft.shortDescription?.trim()) nextErrors.shortDescription = "Informe a descrição curta.";
      if (!draft.description.trim()) nextErrors.description = "Informe a descrição completa.";
      if (draft.includes.filter(Boolean).length < 2) nextErrors.includes = "Adicione pelo menos 2 itens.";
      if (draft.type === "template" && !draft.accessLink?.trim()) nextErrors.accessLink = "Informe o link de acesso.";
      if (draft.type === "mentoria" && !draft.sessionDuration) nextErrors.sessionDuration = "Informe a duração.";
      if (draft.type === "comunidade" && !draft.communityPlatform) nextErrors.communityPlatform = "Informe a plataforma.";
      if (draft.type === "fisico") {
        if (!draft.weight?.trim()) nextErrors.weight = "Informe o peso.";
        if (!draft.height?.trim()) nextErrors.height = "Informe a altura.";
        if (!draft.width?.trim()) nextErrors.width = "Informe a largura.";
        if (!draft.length?.trim()) nextErrors.length = "Informe o comprimento.";
        if (!/^\d{5}-?\d{3}$/.test(draft.originPostalCode ?? "")) nextErrors.originPostalCode = "Informe um CEP valido.";
        if ((draft.stock ?? 0) < 0) nextErrors.stock = "Estoque nao pode ser negativo.";
        if ((draft.stockMinimum ?? 0) < 0) nextErrors.stockMinimum = "Estoque minimo nao pode ser negativo.";
      }
    }
    if (currentStep === 2) {
      if (draft.billingType !== "free" && !draft.price) nextErrors.price = "Informe um preço.";
      if (draft.billingType === "subscription" && !["curso", "comunidade"].includes(draft.type)) {
        nextErrors.billingType = "Assinatura disponível apenas para Curso e Comunidade.";
      }
      if (draft.billingType === "free" && !draft.leadFields?.length) nextErrors.leadFields = "Selecione ao menos um dado.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((current) => Math.min(3, current + 1));
  }

  async function save(status: ProductStatus = draft.status ?? "active") {
    if (uploadingCover) {
      setUploadError("Aguarde o envio da imagem terminar.");
      return;
    }
    if (!validate(1) || !validate(2)) return;
    setSaving(true);
    try {
      await onSave({
        ...draft,
        type: lockedKind && forcedType ? forcedType : draft.type,
        id: draft.id || `${draft.name.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
        description: draft.description,
        shortDescription: draft.shortDescription || draft.description.slice(0, 120),
        active: status === "active",
        status,
        revenue: draft.revenue ?? 0,
        sales: draft.sales ?? 0,
        coverColor: draft.coverGradient?.[1] ?? draft.coverColor,
      });
    } finally {
      setSaving(false);
    }
  }

  async function readCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");

    const fileError = validateImageFile(file, 5 * 1024 * 1024);
    if (fileError) {
      setUploadError(fileError);
      event.target.value = "";
      return;
    }

    setUploadingCover(true);
    try {
      const uploaded = await uploadSignedCloudinaryImage({
        file,
        uploadType: "product_image",
        productKind: draft.type === "fisico" ? "physical" : "digital",
      });
      update("coverImage", uploaded.url);
      update("imageUrl", uploaded.url);
      update("imagePublicId", uploaded.publicId);
      update("imageProvider", "cloudinary");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Nao conseguimos enviar a imagem agora.");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  function insertToken(token: string) {
    update("deliveryMessage", `${draft.deliveryMessage ?? ""} ${token}`.trim());
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--bg-surface)] md:h-[86vh]">
      <div className="border-b border-[var(--border-subtle)] p-5">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2 text-xs font-bold">
              <span
                className={`grid size-7 place-items-center rounded-full ${index < step ? "bg-[#22C55E] text-white" : index === step ? "bg-[#FF4D6D] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}
              >
                {index < step ? <Check size={14} /> : index + 1}
              </span>
              <span className={index === step ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 store-scrollbar">
        {step === 0 && !lockedKind && (
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">Que tipo de produto você vai vender?</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Isso define como seu produto é entregue</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {visibleProductTypeIds.map((type) => {
                const item = PRODUCT_TYPES[type];
                const Icon = item.Icon;
                const selected = draft.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected ? "border-2 border-[#FF4D6D] bg-[#FF4D6D]/[0.08]" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[#FF4D6D]/50"}`}
                  >
                    <Icon size={40} style={{ color: item.color }} />
                    <p className="mt-3 font-heading text-base font-bold text-[var(--text-primary)]">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>
                    <p className="mt-2 text-xs italic text-[var(--text-tertiary)]">{item.example}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <Input label="Nome do produto*" maxLength={80} value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder={placeholders[draft.type]} error={errors.name} />
            <Textarea label="Descrição curta*" maxLength={120} hint={`${draft.shortDescription?.length ?? 0}/120`} value={draft.shortDescription ?? ""} onChange={(e) => update("shortDescription", e.target.value)} placeholder="Uma frase que convence o seguidor a clicar" error={errors.shortDescription} />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">Descrição completa*</span>
                <div className="flex gap-1">
                  {[Bold, Italic, List].map((Icon, i) => (
                    <button key={i} type="button" onClick={() => update("description", `${draft.description}${i === 0 ? "**texto**" : i === 1 ? "*texto*" : "\n- item"}`)} className="grid size-8 place-items-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva detalhadamente o que o cliente recebe, para quem é indicado e qual resultado ele pode esperar" error={errors.description} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">O que está incluído*</span>
                <Button variant="secondary" className="h-9" onClick={() => draft.includes.length < 10 && update("includes", [...draft.includes, ""])}>
                  <Plus size={15} /> Adicionar item
                </Button>
              </div>
              <div className="grid gap-2">
                {draft.includes.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input className="input-base" value={item} placeholder={includeSuggestions[draft.type][index % includeSuggestions[draft.type].length]} onChange={(e) => update("includes", draft.includes.map((v, i) => i === index ? e.target.value : v))} />
                    <button type="button" onClick={() => update("includes", draft.includes.filter((_, i) => i !== index))} className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              {errors.includes && <p className="mt-2 text-xs text-red-400">{errors.includes}</p>}
            </div>
            <div className="grid gap-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">Capa do produto*</span>
              <label className="grid min-h-32 cursor-pointer place-items-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-input)] p-4 text-center">
                {draft.coverImage ? (
                  <Image src={draft.coverImage} alt="" width={1200} height={630} className="max-h-32 max-w-full rounded-xl object-contain" unoptimized={!canUseOptimizedImage(draft.coverImage)} />
                ) : (
                  <><UploadCloud className="mx-auto text-[var(--text-secondary)]" /><span className="mt-2 text-sm text-[var(--text-secondary)]">Arraste ou clique para upload. 1200x630px recomendado</span></>
                )}
                {uploadingCover && <span className="mt-2 text-sm font-bold text-[#FF4D6D]">Enviando imagem...</span>}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={readCover} disabled={uploadingCover} />
              </label>
              {uploadError && <p className="text-xs font-semibold text-red-400">{uploadError}</p>}
              <p className="text-xs text-[var(--text-secondary)]">Use JPG, PNG ou WEBP ate 5 MB.</p>
              <div className="grid grid-cols-4 gap-2">
                {PRODUCT_GRADIENTS[draft.type].concat(PRODUCT_GRADIENTS[draft.type]).slice(0, 8).map((gradient, index) => (
                  <button key={index} type="button" className="h-10 rounded-xl border border-[var(--border-subtle)]" style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }} onClick={() => update("coverGradient", gradient)} />
                ))}
              </div>
            </div>
            <SpecificFields draft={draft} update={update} errors={errors} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {[
                  ["one_time", "Preço único"],
                  ["subscription", "Assinatura"],
                  ["free", "Gratuito"],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => update("billingType", value as Product["billingType"])} className={`h-10 rounded-full px-4 text-sm font-bold ${draft.billingType === value ? "bg-[#FF4D6D] text-white" : "border border-[var(--border-subtle)] text-[var(--text-secondary)]"}`}>{label}</button>
                ))}
              </div>
              {errors.billingType && <p className="text-xs text-red-400">{errors.billingType}</p>}
              {draft.billingType === "one_time" && (
                <div className="grid gap-4">
                  <Input label="Preço*" value={draft.price ? formatPrice(draft.price) : ""} onChange={(e) => update("price", normalizeCurrencyInput(e.target.value))} placeholder="R$ 0,00" error={errors.price} />
                  <Input label="Preço antes do desconto (riscado)" value={draft.originalPrice ? formatPrice(draft.originalPrice) : ""} onChange={(e) => update("originalPrice", normalizeCurrencyInput(e.target.value) || undefined)} placeholder="R$ 0,00" />
                  {discount && <p className="text-sm font-bold text-[#22C55E]">{discount}% de desconto</p>}
                  <label className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm font-medium text-[var(--text-primary)]">
                    Parcelas
                    <select className="input-base max-w-40" value={draft.installments ?? ""} onChange={(e) => update("installments", Number(e.target.value) || undefined)}>
                      <option value="">Desativado</option>
                      {[2, 3, 4, 5, 6, 12].map((n) => <option key={n} value={n}>até {n}x sem juros</option>)}
                    </select>
                  </label>
                </div>
              )}
              {draft.billingType === "subscription" && (
                <div className="grid gap-4">
                  <Input label="Valor por período*" value={draft.price ? formatPrice(draft.price) : ""} onChange={(e) => update("price", normalizeCurrencyInput(e.target.value))} error={errors.price} />
                  <Select label="Período" value={draft.subscriptionPeriod ?? "Mensal"} onChange={(v) => update("subscriptionPeriod", v)} options={["Mensal", "Trimestral", "Semestral", "Anual"]} />
                  <Select label="Teste grátis" value={draft.freeTrialDays ? String(draft.freeTrialDays) : "Sem teste"} onChange={(v) => update("freeTrialDays", v === "Sem teste" ? undefined : Number(v))} options={["Sem teste", "3", "7", "14", "30"]} />
                </div>
              )}
              {draft.billingType === "free" && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  <p className="font-bold text-[var(--text-primary)]">Produto gratuito para captura de lead</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {["Nome", "Email", "WhatsApp"].map((field) => (
                      <label key={field} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <input type="checkbox" className="accent-[#FF4D6D]" checked={draft.leadFields?.includes(field) ?? false} onChange={(e) => update("leadFields", e.target.checked ? [...(draft.leadFields ?? []), field] : (draft.leadFields ?? []).filter((v) => v !== field))} />
                        {field}
                      </label>
                    ))}
                  </div>
                  {errors.leadFields && <p className="mt-2 text-xs text-red-400">{errors.leadFields}</p>}
                </div>
              )}
            </div>
            <div className="sticky top-4 h-fit rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">Você recebe</p>
              <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">{formatPrice(netValue)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">10% por transação</p>
              <p className="mt-4 text-xs text-[var(--text-secondary)]">{formatPrice(draft.price || 0)} → Você recebe {formatPrice(netValue)}</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5">
            <div className="rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-4 text-sm text-[var(--text-primary)]">Após confirmação do pagamento, o cliente recebe acesso automaticamente no email informado.</div>
            <Textarea label="Mensagem de entrega" value={draft.deliveryMessage ?? ""} onChange={(e) => update("deliveryMessage", e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {["{nome}", "{email}", "{produto}", "{link}", "{data}"].map((token) => <button key={token} className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]" onClick={() => insertToken(token)}>{token}</button>)}
            </div>
            <Input label="Página de agradecimento" value={draft.thankYouMessage ?? ""} onChange={(e) => update("thankYouMessage", e.target.value)} />
            <Input label="Sugerir seguir meu Instagram após a compra" value={draft.postPurchaseInstagram ?? ""} onChange={(e) => update("postPurchaseInstagram", e.target.value)} placeholder="@anafitness" />
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Produto ativo" checked={(draft.status ?? "active") === "active"} onChange={(checked) => update("status", checked ? "active" : "hidden")} />
              <Toggle label="Produto em destaque" checked={draft.featured ?? false} onChange={(checked) => update("featured", checked)} />
            </div>
            <UpsellConfigurator draft={draft} products={products} update={update} />
            <SocialProofConfigurator draft={draft} update={update} />
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex gap-3">
                <div className="relative grid size-16 place-items-center overflow-hidden rounded-xl bg-[var(--bg-elevated)]" style={{ background: draft.coverImage ? "var(--bg-elevated)" : `linear-gradient(135deg, ${draft.coverGradient?.[0]}, ${draft.coverGradient?.[1]})` }}>
                  {draft.coverImage && <Image src={draft.coverImage} alt="" fill sizes="64px" className="object-contain p-1" unoptimized={!canUseOptimizedImage(draft.coverImage)} />}
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{draft.name || "Produto sem nome"}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{meta.label} • {formatPrice(draft.price || 0)}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{draft.includes.filter(Boolean).length} itens incluídos • {draft.deliveryPlatform ?? draft.templatePlatform ?? draft.communityPlatform ?? "Entrega automática"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] p-5">
        <Button variant="secondary" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>
          <ArrowLeft size={16} /> Voltar
        </Button>
        {step < 3 ? (
          <Button onClick={next}>Continuar <ArrowRight size={16} /></Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" loading={saving} onClick={() => save("draft")}>Salvar como rascunho</Button>
            <Button loading={saving} onClick={() => save("active")}>Publicar produto</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
      {label}
      <select className="input-base" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm font-medium text-[var(--text-primary)]">
      {label}
      <input type="checkbox" className="size-5 accent-[#FF4D6D]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function SpecificFields({ draft, update, errors }: { draft: Product; update: <K extends keyof Product>(key: K, value: Product[K]) => void; errors: Record<string, string> }) {
  if (draft.type === "infoproduto") {
    return (
      <div className="grid gap-4">
        <div className="rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-4">
          <p className="font-heading text-lg font-bold text-[var(--text-primary)]">Entrega digital</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Após o pagamento aprovado, o cliente recebe acesso automaticamente.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Tipo de entrega" value={draft.deliveryPlatform ?? "Entrega automatica"} onChange={(v) => update("deliveryPlatform", v)} options={["Entrega automatica", "Link externo", "Area de membros", "Email manual"]} />
          <Input label="Link de acesso" value={draft.deliveryUrl ?? ""} onChange={(e) => update("deliveryUrl", e.target.value)} />
          <Input label="Arquivo" value={draft.totalSize ?? ""} onChange={(e) => update("totalSize", e.target.value)} placeholder="PDF, ZIP, video, planilha..." />
          <Textarea className="md:col-span-2" label="Instruções para o comprador" value={draft.usageInstructions ?? ""} onChange={(e) => update("usageInstructions", e.target.value)} />
        </div>
      </div>
    );
  }
  if (draft.type === "fisico") {
    return (
      <div className="grid gap-4">
        <div className="rounded-2xl border border-[#F59E0B]/25 bg-[#F59E0B]/10 p-4">
          <p className="font-heading text-lg font-bold text-[var(--text-primary)]">Entrega física e logística</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Após o pagamento aprovado, você prepara o pedido, gera a etiqueta e acompanha o rastreamento.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="SKU" value={draft.sku ?? ""} onChange={(e) => update("sku", e.target.value)} placeholder="CAM-PIK-001" />
          <Input label="Peso" value={draft.weight ?? ""} onChange={(e) => update("weight", e.target.value)} placeholder="300g" error={errors.weight} />
          <Input label="Altura" value={draft.height ?? ""} onChange={(e) => update("height", e.target.value)} placeholder="5cm" error={errors.height} />
          <Input label="Largura" value={draft.width ?? ""} onChange={(e) => update("width", e.target.value)} placeholder="20cm" error={errors.width} />
          <Input label="Comprimento" value={draft.length ?? ""} onChange={(e) => update("length", e.target.value)} placeholder="25cm" error={errors.length} />
          <Input label="CEP de origem" value={draft.originPostalCode ?? ""} onChange={(e) => update("originPostalCode", e.target.value)} placeholder="01001-000" error={errors.originPostalCode} />
          <Input label="Estoque atual" type="number" value={draft.stock ?? ""} onChange={(e) => update("stock", Number(e.target.value) || 0)} placeholder="24" error={errors.stock} />
          <Input label="Estoque mínimo" type="number" value={draft.stockMinimum ?? ""} onChange={(e) => update("stockMinimum", Number(e.target.value) || 0)} placeholder="10" error={errors.stockMinimum} />
          <Input label="Prazo de preparo" value={draft.preparationTime ?? ""} onChange={(e) => update("preparationTime", e.target.value)} placeholder="2 dias uteis" />
          <Input label="Forma de entrega" value={draft.deliveryPlatform ?? "Envio manual"} onChange={(e) => update("deliveryPlatform", e.target.value)} placeholder="Correios, transportadora, retirada..." />
          <Toggle label="Controlar estoque" checked={draft.trackInventory ?? true} onChange={(value) => update("trackInventory", value)} />
          <Toggle label="Permitir venda sem estoque" checked={draft.allowBackorder ?? false} onChange={(value) => update("allowBackorder", value)} />
          <Textarea className="md:col-span-2" label="Observacoes de envio" value={draft.shippingNotes ?? ""} onChange={(e) => update("shippingNotes", e.target.value)} placeholder="Informacoes internas sobre embalagem, postagem ou preparo." />
        </div>
      </div>
    );
  }
  if (draft.type === "ebook") {
    return <div className="grid gap-4 md:grid-cols-2"><Select label="Plataforma de entrega" value={draft.deliveryPlatform ?? "Vou subir o arquivo aqui"} onChange={(v) => update("deliveryPlatform", v)} options={["Vou subir o arquivo aqui", "Link externo", "Notion / outro"]} /><Input label="Link externo" value={draft.deliveryUrl ?? ""} onChange={(e) => update("deliveryUrl", e.target.value)} /><Input label="Número de páginas" type="number" value={draft.pages ?? ""} onChange={(e) => update("pages", Number(e.target.value) || undefined)} /><Select label="Idioma" value={draft.language ?? "Português"} onChange={(v) => update("language", v as Product["language"])} options={["Português", "Inglês", "Espanhol"]} /><Select label="Nível" value={draft.level ?? "Iniciante"} onChange={(v) => update("level", v as Product["level"])} options={["Iniciante", "Intermediário", "Avançado"]} /></div>;
  }
  if (draft.type === "planilha") {
    return <div className="grid gap-4"><Select label="Plataforma" value={draft.deliveryPlatform ?? "Excel (.xlsx)"} onChange={(v) => update("deliveryPlatform", v)} options={["Excel (.xlsx)", "Google Sheets (link)", "Numbers"]} /><Input label="Link Google Sheets" value={draft.deliveryUrl ?? ""} onChange={(e) => update("deliveryUrl", e.target.value)} /><Checkboxes label="Compatível com" values={["PC", "Mac", "Celular"]} selected={draft.compatibleWith ?? []} onChange={(v) => update("compatibleWith", v)} /></div>;
  }
  if (draft.type === "template") {
    return <div className="grid gap-4"><Select label="Plataforma*" value={draft.templatePlatform ?? "Canva"} onChange={(v) => update("templatePlatform", v)} options={["Canva", "Notion", "Figma", "PowerPoint", "Google Slides", "Outro"]} /><Input label="Link de acesso ao template*" value={draft.accessLink ?? ""} onChange={(e) => update("accessLink", e.target.value)} error={errors.accessLink} /><Textarea label="Instruções de uso" value={draft.usageInstructions ?? ""} onChange={(e) => update("usageInstructions", e.target.value)} /></div>;
  }
  if (draft.type === "curso") {
    return <div className="grid gap-4"><Input label="Total de aulas" type="number" value={draft.lessonCount ?? ""} onChange={(e) => update("lessonCount", Number(e.target.value) || undefined)} /><Select label="Duração total" value={draft.duration ?? "1-3h"} onChange={(v) => update("duration", v)} options={["< 1h", "1-3h", "3-10h", "+10h"]} /><Select label="Onde estão as aulas" value={draft.coursePlatform ?? "YouTube privado / não listado"} onChange={(v) => update("coursePlatform", v)} options={["YouTube privado / não listado", "Google Drive", "Hotmart", "Kiwify", "Outro link"]} /><Input label="URL da plataforma" value={draft.courseUrl ?? ""} onChange={(e) => update("courseUrl", e.target.value)} /><Modules draft={draft} update={update} /><Input label="Pré-requisitos" value={draft.prerequisites ?? ""} onChange={(e) => update("prerequisites", e.target.value)} /><Toggle label="Certificado" checked={draft.certificate ?? false} onChange={(v) => update("certificate", v)} /></div>;
  }
  if (draft.type === "mentoria") {
    return <div className="grid gap-4 md:grid-cols-2"><Select label="Duração da sessão*" value={draft.sessionDuration ?? "1h"} onChange={(v) => update("sessionDuration", v)} error={errors.sessionDuration} options={["30min", "45min", "1h", "1h30", "2h"]} /><Select label="Formato*" value={draft.sessionFormat ?? "Google Meet"} onChange={(v) => update("sessionFormat", v)} options={["Google Meet", "Zoom", "Teams", "WhatsApp Video"]} /><Select label="Como agendar*" value={draft.schedulingMethod ?? "Combinado após pagamento"} onChange={(v) => update("schedulingMethod", v)} options={["Calendly (link)", "WhatsApp", "Email", "Combinado após pagamento"]} /><Input label="Link/número/email" value={draft.schedulingValue ?? ""} onChange={(e) => update("schedulingValue", e.target.value)} /><Textarea label="Disponibilidade" value={draft.availability ?? ""} onChange={(e) => update("availability", e.target.value)} /><Toggle label="Inclui gravação" checked={draft.recordingIncluded ?? false} onChange={(v) => update("recordingIncluded", v)} /><Input label="Vagas disponíveis" type="number" value={draft.seats ?? ""} onChange={(e) => update("seats", Number(e.target.value) || undefined)} /></div>;
  }
  if (draft.type === "pack") {
    return <div className="grid gap-4"><Input label="Número de arquivos" type="number" value={draft.fileCount ?? ""} onChange={(e) => update("fileCount", Number(e.target.value) || undefined)} /><Checkboxes label="Tipos de arquivo inclusos" values={["PDF", "JPG/PNG", "MP4", "MP3", "PSD", "AI", "ZIP", "Excel", "Outro"]} selected={draft.fileTypes ?? []} onChange={(v) => update("fileTypes", v)} /><Select label="Tamanho total aproximado" value={draft.totalSize ?? "< 10MB"} onChange={(v) => update("totalSize", v)} options={["< 10MB", "10-50MB", "50-200MB", "+200MB"]} /><Select label="Plataforma de entrega" value={draft.deliveryPlatform ?? "Link externo"} onChange={(v) => update("deliveryPlatform", v)} options={["Vou subir o arquivo aqui", "Link externo", "Notion / outro"]} /><Select label="Licença" value={draft.license ?? "Uso pessoal"} onChange={(v) => update("license", v)} options={["Uso pessoal", "Uso comercial", "Revenda"]} /></div>;
  }
  return <div className="grid gap-4"><Select label="Plataforma*" value={draft.communityPlatform ?? "WhatsApp"} onChange={(v) => update("communityPlatform", v)} error={errors.communityPlatform} options={["WhatsApp", "Telegram", "Discord", "Circle", "Outro"]} /><Select label="Como funciona o acesso*" value={draft.accessMethod ?? "Link de convite enviado por email"} onChange={(v) => update("accessMethod", v)} options={["Link de convite enviado por email", "Aprovação manual pelo criador", "Código de acesso"]} /><Select label="Frequência de conteúdo" value={draft.contentFrequency ?? "Semanal"} onChange={(v) => update("contentFrequency", v)} options={["Diário", "Semanal", "Quinzenal", "Mensal", "Sem frequência fixa"]} /><Input label="Número atual de membros" type="number" value={draft.members ?? ""} onChange={(e) => update("members", Number(e.target.value) || undefined)} /><Select label="Renovação" value={draft.renewal ?? "Mensal"} onChange={(v) => update("renewal", v)} options={["Mensal", "Trimestral", "Anual", "Vitalício"]} /></div>;
}

function Checkboxes({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return <div><p className="mb-2 text-sm font-medium text-[var(--text-primary)]">{label}</p><div className="flex flex-wrap gap-3">{values.map((value) => <label key={value} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" className="accent-[#FF4D6D]" checked={selected.includes(value)} onChange={(e) => onChange(e.target.checked ? [...selected, value] : selected.filter((item) => item !== value))} />{value}</label>)}</div></div>;
}

function Modules({ draft, update }: { draft: Product; update: <K extends keyof Product>(key: K, value: Product[K]) => void }) {
  const modules = draft.modules ?? [];
  return <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-[var(--text-primary)]">Módulos</p><Button variant="secondary" className="h-9" onClick={() => modules.length < 10 && update("modules", [...modules, { id: `mod-${Date.now()}`, name: "", lessons: 1 }])}><Plus size={15} />Adicionar módulo</Button></div><div className="grid gap-2">{modules.map((module) => <div key={module.id} className="grid grid-cols-[1fr_90px] gap-2"><input className="input-base" value={module.name} onChange={(e) => update("modules", modules.map((item) => item.id === module.id ? { ...item, name: e.target.value } : item))} placeholder="Módulo 1: Fundamentos" /><input className="input-base" type="number" value={module.lessons} onChange={(e) => update("modules", modules.map((item) => item.id === module.id ? { ...item, lessons: Number(e.target.value) || 1 } : item))} /></div>)}</div></div>;
}

function UpsellConfigurator({
  draft,
  products,
  update,
}: {
  draft: Product;
  products: Product[];
  update: <K extends keyof Product>(key: K, value: Product[K]) => void;
}) {
  const enabled = Boolean(draft.upsell);
  const candidates = products.filter((product) => product.id !== draft.id && (product.status ?? "active") === "active");
  const selected = candidates.find((product) => product.id === draft.upsell?.productId) ?? candidates[0];
  const upsellPrice = draft.upsell?.price ?? selected?.price ?? 0;
  const originalPrice = draft.upsell?.originalPrice ?? selected?.price ?? 0;
  const discount = selected && originalPrice ? Math.max(0, Math.round(((originalPrice - upsellPrice) / originalPrice) * 100)) : 0;

  function setEnabled(next: boolean) {
    if (!next) {
      update("upsell", null);
      return;
    }
    if (!selected) return;
    update("upsell", {
      productId: selected.id,
      price: selected.price,
      originalPrice: selected.price,
      buttonText: "Sim, quero adicionar",
      discount: 0,
    });
  }

  function updateUpsell(partial: Partial<NonNullable<Product["upsell"]>>) {
    if (!selected) return;
    const next = {
      productId: selected.id,
      price: selected.price,
      originalPrice: selected.price,
      buttonText: "Sim, quero adicionar",
      discount: 0,
      ...(draft.upsell ?? {}),
      ...partial,
    };
    next.discount = next.originalPrice ? Math.max(0, Math.round(((next.originalPrice - next.price) / next.originalPrice) * 100)) : 0;
    update("upsell", next);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <Toggle label="Oferecer outro produto como upsell" checked={enabled} onChange={setEnabled} />
      {enabled && selected && (
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
            Qual produto oferecer?
            <select
              className="input-base"
              value={draft.upsell?.productId ?? selected.id}
              onChange={(event) => {
                const product = candidates.find((item) => item.id === event.target.value);
                if (!product) return;
                update("upsell", {
                  productId: product.id,
                  price: product.price,
                  originalPrice: product.price,
                  buttonText: draft.upsell?.buttonText ?? "Sim, quero adicionar",
                  discount: 0,
                });
              }}
            >
              <option value="">Escolha um produto...</option>
              {candidates.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {PRODUCT_TYPES[product.type].label} - {formatPrice(product.price)}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Preço do upsell"
            value={upsellPrice ? formatPrice(upsellPrice) : ""}
            onChange={(event) => {
              const price = normalizeCurrencyInput(event.target.value);
              updateUpsell({ price: Math.min(price, selected.price), originalPrice: selected.price });
            }}
            placeholder={formatPrice(selected.price)}
          />
          {discount > 0 ? (
            <p className="text-sm font-bold text-[#22C55E]">Desconto de {discount}% em relação ao preço original</p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">💡 Considere dar um desconto para aumentar a conversão</p>
          )}
          <Input
            label="Texto do botão"
            maxLength={40}
            value={draft.upsell?.buttonText ?? ""}
            onChange={(event) => updateUpsell({ buttonText: event.target.value })}
            placeholder="Sim, quero adicionar"
          />
          <div className="rounded-2xl border-2 border-[#FF4D6D] bg-[#FF4D6D]/[0.05] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF4D6D]">Oferta exclusiva</p>
            <p className="mt-2 font-bold text-[var(--text-primary)]">{selected.name}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{selected.shortDescription ?? selected.description}</p>
            <p className="mt-2 text-lg font-extrabold text-[#FF4D6D]">{formatPrice(upsellPrice)}</p>
            <p className="mt-3 rounded-xl bg-[#FF4D6D] px-4 py-3 text-center text-sm font-bold text-white">
              {draft.upsell?.buttonText || "Sim, quero adicionar"} +{formatPrice(upsellPrice)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialProofConfigurator({
  draft,
  update,
}: {
  draft: Product;
  update: <K extends keyof Product>(key: K, value: Product[K]) => void;
}) {
  const [enabled, setEnabled] = useState((draft.reviews?.length ?? 0) > 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState<Review>({
    id: "",
    author: "",
    avatar: reviewAvatarColors[0],
    rating: 5,
    text: "",
    date: "",
    verified: false,
  });

  const reviews = draft.reviews ?? [];
  const authorError = showForm && !form.author.trim() ? "Informe o nome do cliente." : "";
  const ratingError = showForm && !form.rating ? "Selecione uma nota." : "";
  const textError = showForm && form.text.trim().length > 0 && form.text.trim().length < 20 ? "Use pelo menos 20 caracteres." : "";
  const canSave = form.author.trim().length > 0 && form.rating >= 1 && form.text.trim().length >= 20;

  function setReviews(next: Review[]) {
    update("reviews", next);
  }

  function resetForm() {
    setForm({
      id: "",
      author: "",
      avatar: reviewAvatarColors[Math.floor(Math.random() * reviewAvatarColors.length)],
      rating: 5,
      text: "",
      date: "",
      verified: false,
    });
    setEditingId(null);
    setShowForm(false);
    setHoverRating(0);
  }

  function startCreate(text = "") {
    setForm({
      id: "",
      author: "",
      avatar: reviewAvatarColors[Math.floor(Math.random() * reviewAvatarColors.length)],
      rating: 5,
      text,
      date: "",
      verified: false,
    });
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(review: Review) {
    setForm(review);
    setEditingId(review.id);
    setShowForm(true);
  }

  function saveReview() {
    if (!canSave) return;
    const nextReview: Review = {
      ...form,
      id: editingId ?? `review-${Date.now()}`,
      author: form.author.slice(0, 40),
      text: form.text.slice(0, 280),
      date: form.date || new Date().toISOString().slice(0, 10),
      verified: false,
    };
    if (editingId) {
      setReviews(reviews.map((review) => (review.id === editingId ? nextReview : review)));
    } else if (reviews.length < 12) {
      setReviews([...reviews, nextReview]);
    }
    resetForm();
  }

  function readAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function moveReview(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= reviews.length) return;
    const next = [...reviews];
    [next[index], next[target]] = [next[target], next[index]];
    setReviews(next);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <Toggle
        label="Adicionar avaliacoes ao produto"
        checked={enabled}
        onChange={(checked) => {
          setEnabled(checked);
          if (!checked) {
            setShowForm(false);
            setReviews([]);
          }
        }}
      />
      <p className="mt-2 text-xs text-[var(--text-secondary)]">Avaliacoes aumentam a confianca e a conversao.</p>

      {enabled && (
        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">{reviews.length}/12 avaliacoes</p>
            <Button variant="secondary" className="h-9" disabled={reviews.length >= 12} onClick={() => startCreate()}>
              <Plus size={15} />
              Adicionar avaliacao
            </Button>
          </div>

          {reviews.length > 0 && (
            <div className="grid gap-2">
              {reviews.map((review, index) => (
                <div key={review.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-[var(--text-tertiary)]" />
                    <button type="button" onClick={() => moveReview(index, -1)} className="text-[10px] text-[var(--text-secondary)]">↑</button>
                    <button type="button" onClick={() => moveReview(index, 1)} className="text-[10px] text-[var(--text-secondary)]">↓</button>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold text-white" style={{ backgroundColor: review.avatar.startsWith("data:") ? "#111" : review.avatar }}>
                      {review.avatar.startsWith("data:") ? <Image src={review.avatar} alt="" fill sizes="40px" className="object-contain" unoptimized /> : review.author.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">{review.author}</p>
                        <span className="flex text-[#F59E0B]">{Array.from({ length: review.rating }, (_, star) => <Star key={star} size={12} fill="currentColor" />)}</span>
                      </div>
                      <p className="truncate text-xs text-[var(--text-secondary)]">{review.text}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => startEdit(review)} className="grid size-8 place-items-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)]"><Edit2 size={14} /></button>
                    <button type="button" onClick={() => setReviews(reviews.filter((item) => item.id !== review.id))} className="grid size-8 place-items-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  label="Nome do cliente*"
                  maxLength={40}
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                  error={authorError}
                />
                <label className="grid content-end gap-2 text-sm font-medium text-[var(--text-primary)]">
                  Foto
                  <span className="flex h-11 cursor-pointer items-center justify-center rounded-[10px] border border-[var(--border-subtle)] px-4 text-sm text-[var(--text-secondary)]">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={readAvatar} />
                  </span>
                </label>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Avaliacao em estrelas*</p>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onMouseEnter={() => setHoverRating(rating)}
                      onClick={() => setForm({ ...form, rating })}
                      className="text-[#F59E0B]"
                      aria-label={`${rating} estrelas`}
                    >
                      <Star size={24} fill={(hoverRating || form.rating) >= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                {ratingError && <p className="mt-2 text-xs text-red-400">{ratingError}</p>}
              </div>
              <Textarea
                label="Texto da avaliacao*"
                minLength={20}
                maxLength={280}
                hint={`${form.text.length}/280`}
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                error={textError}
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input label="Data" type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(form.date) ? form.date : ""} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={saveReview} disabled={!canSave}>Salvar avaliacao</Button>
                <Button variant="secondary" onClick={resetForm}>Cancelar</Button>
              </div>
            </div>
          )}

          <div>
            <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="text-sm font-bold text-[#FF4D6D]">
              {showSuggestions ? "Ocultar sugestoes" : "Ver sugestoes"}
            </button>
            {showSuggestions && (
              <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="text-sm font-bold text-[var(--text-primary)]">Precisa de inspiracao? Use como base:</p>
                {reviewSuggestions[draft.type].map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => startCreate(suggestion)} className="rounded-xl bg-[var(--bg-elevated)] p-3 text-left text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

