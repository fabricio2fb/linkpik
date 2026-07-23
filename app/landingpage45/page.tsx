import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Instagram,
  Link2,
  LockKeyhole,
  MessageCircle,
  Music2,
  PackageCheck,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Landingpage45 | Pikbio",
  description:
    "Uma loja na bio para criadores venderem produtos digitais com checkout, upsell e entrega automatica.",
  robots: {
    index: false,
    follow: false,
  },
};

const quickAnswers = [
  {
    icon: Store,
    question: "O que e?",
    answer: "Uma loja completa dentro do link da bio.",
  },
  {
    icon: ShoppingBag,
    question: "O que vende?",
    answer: "Ebooks, planilhas, cursos, templates, packs e mentorias.",
  },
  {
    icon: CreditCard,
    question: "Como recebe?",
    answer: "Com checkout conectado ao pagamento do criador.",
  },
  {
    icon: PackageCheck,
    question: "Como entrega?",
    answer: "Acesso digital liberado depois da aprovacao.",
  },
];

const proofItems = [
  "Pagina de loja pronta para mobile",
  "Checkout sem conversa manual no direct",
  "Upsell para aumentar ticket medio",
  "Painel para acompanhar vendas e acessos",
];

const useCases = [
  { label: "Personal trainer", value: "planilha + ebook", accent: "#22C55E" },
  { label: "Designer", value: "templates + pack", accent: "#38BDF8" },
  { label: "Educador", value: "curso + material", accent: "#F59E0B" },
  { label: "Consultor", value: "mentoria + guia", accent: "#A855F7" },
];

const steps = [
  {
    icon: Link2,
    title: "Monte o link",
    text: "Adicione bio, redes, capa, video, produtos e visual. O visitante entende sua oferta em segundos.",
  },
  {
    icon: Wallet,
    title: "Venda sem improviso",
    text: "O comprador escolhe o produto, ve o preco, passa pelo checkout e recebe confirmacao clara.",
  },
  {
    icon: BarChart3,
    title: "Melhore pelo painel",
    text: "Acompanhe receita, pedidos, produtos ativos e acessos entregues para ajustar a proxima oferta.",
  },
];

const comparison = [
  ["Cliente pergunta preco no direct", "Preco claro na pagina"],
  ["Voce envia Pix, link e arquivo manualmente", "Checkout e entrega no mesmo fluxo"],
  ["Pedidos se perdem em conversas", "Vendas organizadas no painel"],
  ["Cada oferta precisa ser explicada de novo", "Produto publicado com descricao e prova"],
];

const features = [
  { icon: Palette, title: "Vitrine com identidade", text: "Capa, avatar, cores, produtos, links e temas para sua oferta parecer confiavel." },
  { icon: CreditCard, title: "Checkout guiado", text: "Resumo do pedido, dados do comprador e status do pagamento em uma jornada simples." },
  { icon: Zap, title: "Upsell no momento certo", text: "Ofereca um produto complementar antes do pagamento e aumente o valor por cliente." },
  { icon: LockKeyhole, title: "Acesso protegido", text: "Entregue link, arquivo ou instrucao digital depois da aprovacao do pedido." },
  { icon: TrendingUp, title: "Metricas acionaveis", text: "Veja receita, vendas, conversao e produtos que merecem mais divulgacao." },
  { icon: ShieldCheck, title: "Base para operar", text: "Menos conversa repetida e mais processo para vender todos os dias." },
];

const footerColumns = [
  {
    title: "Produto",
    links: [
      { label: "Como funciona", href: "/como-funciona" },
      { label: "Loja exemplo", href: "/lojaexemplo" },
      { label: "Demo", href: "/demo" },
      { label: "Criar loja", href: "/registro" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Recuperar senha", href: "/recuperar-senha" },
      { label: "Contato", href: "/contato" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
      { label: "Solicitar dados", href: "/privacidade/solicitar" },
    ],
  },
];

const faq = [
  ["Preciso saber programar?", "Nao. A proposta e montar a loja pelo painel, publicar produtos e copiar o link para usar na bio."],
  ["Serve para produto fisico?", "Esta landing foca em produtos digitais, mas o projeto tambem tem areas de produtos fisicos e entregas."],
  ["O comprador precisa criar conta?", "A jornada foi pensada para reduzir atrito: ele escolhe, paga e recebe o acesso do produto comprado."],
  ["Consigo validar uma oferta pequena?", "Sim. A pagina foi desenhada para quem quer testar um ebook, planilha, pack ou mentoria antes de criar uma estrutura maior."],
];

export default function LandingPage45() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#171717]">
      <Header />
      <Hero />
      <AnswerStrip />
      <ProblemSolution />
      <ProductSystem />
      <HowItWorks />
      <FeatureGrid />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-[#FAFAF7]/88 px-4 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <BrandLogo textClassName="text-[#171717]" />
        <nav className="hidden items-center gap-7 text-sm font-bold text-[#171717]/55 md:flex">
          <a href="#respostas" className="font-bold transition hover:text-[#171717]">Respostas</a>
          <a href="#sistema" className="font-bold transition hover:text-[#171717]">Produto</a>
          <a href="#precos" className="font-bold transition hover:text-[#171717]">Precos</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-[#171717]/58 transition hover:text-[#171717]">
            Entrar
          </Link>
          <Link href="/registro" className="inline-flex h-10 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#FF4D6D]">
            Criar loja
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-14 md:pb-20 md:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(23,23,23,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(23,23,23,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 px-3 py-2 text-xs font-black uppercase text-[#C91F45]">
            <Sparkles size={15} />
            Loja na bio para vender de verdade
          </div>
          <h1 className="mt-6 max-w-4xl font-heading text-5xl font-black leading-[0.96] tracking-[-0.055em] text-[#171717] md:text-7xl">
            Sua bio com cara de loja, checkout e entrega automatica.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#525252]">
            Uma vitrine mobile-first para vender ebook, planilha, curso, pack ou mentoria sem depender do direct.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registro" className="group inline-flex h-14 items-center justify-center rounded-full bg-[#FF4D6D] px-7 text-base font-black text-white shadow-[0_24px_70px_rgba(255,77,109,0.28)] transition hover:-translate-y-1 hover:bg-[#ff2d55]">
              Criar minha loja gratis
              <ArrowRight className="ml-2 transition group-hover:translate-x-1" size={18} />
            </Link>
            <Link href="/lojaexemplo" className="inline-flex h-14 items-center justify-center rounded-full border border-black/[0.12] bg-white px-7 text-base font-black text-[#171717] transition hover:-translate-y-1 hover:border-[#171717]/25">
              Ver loja exemplo
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <HeroMetric value="1 link" label="loja + checkout" />
            <HeroMetric value="3 passos" label="publicar oferta" />
            <HeroMetric value="24/7" label="venda online" />
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[8px] border border-black/[0.08] bg-white/80 p-4 shadow-[0_16px_50px_rgba(23,23,23,0.05)]">
      <p className="font-heading text-xl font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase leading-4 text-[#777]">{label}</p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto min-h-[640px] w-full max-w-[720px]">
      <div className="absolute right-3 top-0 w-[315px] rounded-[40px] border border-black/[0.12] bg-[#171717] p-3 shadow-[0_36px_110px_rgba(23,23,23,0.28)] sm:right-10 sm:w-[360px]">
        <div className="overflow-hidden rounded-[31px] bg-[#FDFDFB]">
          <div className="flex h-9 items-center justify-between bg-[#111] px-6 text-[10px] font-black text-white/48">
            <span>9:41</span>
            <span>pik.bio/anatreina</span>
            <span>5G</span>
          </div>
          <div className="h-28 bg-[linear-gradient(135deg,#FF4D6D,#F59E0B_52%,#22C55E)]" />
          <div className="px-5 pb-5">
            <div className="-mt-9 grid size-18 place-items-center rounded-full border-4 border-[#FDFDFB] bg-[#171717]">
              <Image src="/logo-pikbio.png" alt="" width={45} height={45} className="object-contain" priority />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-black tracking-[-0.04em]">Ana Treina</h2>
            <p className="mt-1 text-sm leading-5 text-[#666]">Planilhas, ebooks e mentorias para treinar melhor.</p>
            <div className="mt-5 grid gap-3">
              <StoreProduct title="Planilha 12 semanas" price="R$ 47" color="#22C55E" />
              <StoreProduct title="Ebook Low Carb" price="R$ 27" color="#FF4D6D" />
              <StoreProduct title="Mentoria 1h" price="R$ 197" color="#F59E0B" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-20 hidden w-[365px] rounded-[26px] border border-black/[0.10] bg-white p-4 shadow-[0_30px_90px_rgba(23,23,23,0.18)] md:block">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
          <div>
            <p className="text-xs font-black uppercase text-[#737373]">Painel</p>
            <h3 className="mt-1 font-heading text-2xl font-black tracking-[-0.04em]">Vendas de hoje</h3>
          </div>
          <span className="rounded-full bg-[#22C55E]/12 px-3 py-2 text-xs font-black text-[#16A34A]">+18%</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat value="R$ 842" label="receita" />
          <MiniStat value="19" label="pedidos" />
          <MiniStat value="4.8%" label="conv." />
        </div>
        <div className="mt-4 grid gap-2">
          {["Planilha 12 semanas", "Ebook Low Carb", "Mentoria 1h"].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-2xl bg-[#F5F5F0] p-3">
              <span className="min-w-0 truncate text-sm font-bold">{item}</span>
              <span className={index === 2 ? "text-sm font-black text-[#F59E0B]" : "text-sm font-black text-[#16A34A]"}>{index === 2 ? "pendente" : "pago"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-5 w-[340px] rounded-[26px] border border-black/[0.10] bg-[#171717] p-4 text-white shadow-[0_30px_90px_rgba(23,23,23,0.30)] sm:left-20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-white/38">Checkout</p>
            <h3 className="mt-1 font-heading text-xl font-black">Pedido aprovado</h3>
          </div>
          <BadgeCheck className="text-[#22C55E]" size={28} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.06] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Produto + upsell</span>
            <strong>R$ 66</strong>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-[#22C55E] px-4 py-3 text-sm font-black text-[#062B15]">
            <PackageCheck size={17} />
            Acesso liberado
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreProduct({ title, price, color }: { title: string; price: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-[0_10px_30px_rgba(23,23,23,0.06)]">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: color }}>
        <FileText size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#777]">Entrega automatica</p>
      </div>
      <p className="text-sm font-black" style={{ color }}>{price}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[#171717] p-3 text-white">
      <p className="font-heading text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/38">{label}</p>
    </div>
  );
}

function AnswerStrip() {
  return (
    <section id="respostas" className="px-5 pb-10 pt-2">
      <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-4">
        {quickAnswers.map((item) => (
          <AnswerCard key={item.question} {...item} />
        ))}
      </div>
    </section>
  );
}

function AnswerCard({ icon: Icon, question, answer }: { icon: LucideIcon; question: string; answer: string }) {
  return (
    <div className="rounded-[8px] border border-black/[0.08] bg-white p-5 shadow-[0_16px_50px_rgba(23,23,23,0.06)]">
      <Icon size={22} className="text-[#FF4D6D]" />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#777]">{question}</p>
      <p className="mt-2 text-base font-black leading-6">{answer}</p>
    </div>
  );
}

function ProblemSolution() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF4D6D]">Valor real</p>
          <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
            Menos texto. Mais caminho visual ate a compra.
          </h2>
          <div className="mt-7 grid gap-3">
            {proofItems.map((item) => (
              <p key={item} className="flex items-center gap-3 rounded-[8px] border border-black/[0.08] bg-white px-4 py-3 text-sm font-black text-[#404040]">
                <CheckCircle2 size={18} className="shrink-0 text-[#16A34A]" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <BeforeAfterPanel type="before" />
          <BeforeAfterPanel type="after" />
        </div>
      </div>
    </section>
  );
}

function BeforeAfterPanel({ type }: { type: "before" | "after" }) {
  const isAfter = type === "after";
  const rows = isAfter
    ? ["Preco visivel", "Checkout no clique", "Entrega automatica", "Painel organizado"]
    : ["Preco no direct", "Pix manual", "Arquivo por mensagem", "Pedido em conversa"];

  return (
    <div className={`overflow-hidden rounded-[8px] border p-4 shadow-[0_20px_70px_rgba(23,23,23,0.08)] ${isAfter ? "border-[#22C55E]/30 bg-[#F0FDF4]" : "border-[#FB7185]/30 bg-[#FFF1F2]"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-black uppercase tracking-[0.18em] ${isAfter ? "text-[#15803D]" : "text-[#BE123C]"}`}>
          {isAfter ? "Com Pikbio" : "Sem estrutura"}
        </p>
        <span className={`grid size-9 place-items-center rounded-[8px] ${isAfter ? "bg-[#22C55E] text-[#052E16]" : "bg-[#FB7185] text-white"}`}>
          {isAfter ? <Check size={18} /> : <X size={18} />}
        </span>
      </div>
      <div className="mt-5 rounded-[8px] bg-white p-3">
        <div className="flex items-center gap-3">
          <span className={`grid size-12 place-items-center rounded-[8px] text-white ${isAfter ? "bg-[#171717]" : "bg-[#9F1239]"}`}>
            {isAfter ? <Store size={21} /> : <MessageCircle size={21} />}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-xl font-black tracking-[-0.04em]">{isAfter ? "Loja publicada" : "Conversa aberta"}</p>
            <p className="text-xs font-bold text-[#777]">{isAfter ? "pik.bio/anatreina" : "cliente: tem valor?"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {rows.map((row, index) => (
            <div key={row} className="flex items-center justify-between rounded-[8px] bg-[#F7F7F2] px-3 py-2">
              <span className="text-sm font-bold text-[#555]">{row}</span>
              <span className={`size-2 rounded-full ${isAfter || index === 0 ? "bg-[#22C55E]" : "bg-[#FB7185]"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSystem() {
  return (
    <section id="sistema" className="bg-[#171717] px-5 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF8EA2]">Sistema completo</p>
            <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
              Um produto visual, nao uma lista de promessas.
            </h2>
          </div>
          <p className="text-lg leading-8 text-white/58">
            A pessoa ve a loja, entende a oferta, compra, recebe o acesso e voce acompanha o resultado.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <VisualStage title="Loja" icon={Store} accent="#FF4D6D" />
            <VisualStage title="Produto" icon={ShoppingBag} accent="#38BDF8" />
            <VisualStage title="Checkout" icon={CreditCard} accent="#F59E0B" />
            <VisualStage title="Acesso" icon={LockKeyhole} accent="#22C55E" />
          </div>

          <div className="rounded-[8px] border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-5">
            <div className="rounded-[8px] border border-white/[0.08] bg-[#101010] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/38">Painel ao vivo</p>
                  <h3 className="mt-1 font-heading text-3xl font-black tracking-[-0.05em]">R$ 4.890</h3>
                </div>
                <span className="rounded-full bg-[#22C55E]/12 px-3 py-2 text-xs font-black text-[#22C55E]">+18%</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <DashboardTile value="124" label="vendas" />
                <DashboardTile value="8" label="produtos" />
                <DashboardTile value="98%" label="entregas" />
              </div>
              <div className="mt-5 grid gap-2">
                {useCases.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[8px] bg-white/[0.05] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{item.label}</p>
                      <p className="text-xs font-bold text-white/38">{item.value}</p>
                    </div>
                    <span className="size-3 rounded-full" style={{ backgroundColor: item.accent }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualStage({ title, icon: Icon, accent }: { title: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-white/[0.10] bg-white/[0.05] p-4">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-[8px] text-white" style={{ backgroundColor: accent }}>
          <Icon size={20} />
        </span>
        <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] font-black uppercase text-white/42">ativo</span>
      </div>
      <h3 className="mt-6 font-heading text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <div className="mt-4 rounded-[8px] border border-white/[0.08] bg-[#0B0B0B] p-3">
        <div className="h-16 rounded-[8px]" style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.12))` }} />
        <div className="mt-3 grid gap-2">
          <span className="h-3 w-4/5 rounded-full bg-white/20" />
          <span className="h-3 w-2/3 rounded-full bg-white/10" />
          <span className="h-9 rounded-full" style={{ backgroundColor: accent }} />
        </div>
      </div>
    </div>
  );
}

function DashboardTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[8px] bg-white/[0.05] p-3">
      <p className="font-heading text-xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/34">{label}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Como funciona" title="Tres telas que explicam tudo." text="O usuario entende pela interface: monta a loja, compra o produto e recebe acesso." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[8px] border border-black/[0.08] bg-white p-6 shadow-[0_18px_60px_rgba(23,23,23,0.06)]">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-[8px] bg-[#FF4D6D]/10 text-[#FF4D6D]">
                  <step.icon size={22} />
                </span>
                <span className="font-heading text-4xl font-black text-[#171717]/10">0{index + 1}</span>
              </div>
              <h3 className="mt-8 font-heading text-2xl font-black tracking-[-0.04em]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#666]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Recursos" title="Cards visuais para cada duvida importante." text="Menos texto corrido, mais sinais claros de produto, pagamento, entrega e controle." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="overflow-hidden rounded-[8px] border border-black/[0.08] bg-[#FAFAF7] p-4">
              <div className="rounded-[8px] border border-black/[0.06] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-[#FF4D6D]/10 text-[#FF4D6D]">
                    <feature.icon size={20} />
                  </span>
                  <span className="h-2 w-16 rounded-full bg-[#171717]/10" />
                </div>
                <div className="mt-4 h-16 rounded-[8px] bg-[linear-gradient(135deg,rgba(255,77,109,0.16),rgba(245,158,11,0.14),rgba(34,197,94,0.12))]" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-black tracking-[-0.035em]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#666]">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" className="px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF4D6D]">Preco</p>
          <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
            Comece pequeno e deixe a loja provar valor.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#575757]">
            A landing precisa diminuir risco percebido. Por isso, o modelo deixa claro que o criador pode validar a primeira oferta antes de escalar.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PriceCard title="Free" price="R$ 0" note="para validar" items={["Loja na bio", "Produtos digitais", "Checkout", "Entrega configurada", "Metricas basicas"]} />
          <PriceCard highlighted title="Pro" price="R$ 29" note="para vender mais" items={["Produtos ilimitados", "Upsell completo", "Mais temas", "Pixels e analytics", "Marca mais profissional"]} />
        </div>
      </div>
    </section>
  );
}

function PriceCard({ title, price, note, items, highlighted = false }: { title: string; price: string; note: string; items: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-[8px] border p-6 ${highlighted ? "border-[#FF4D6D]/45 bg-[#171717] text-white shadow-[0_28px_90px_rgba(23,23,23,0.22)]" : "border-black/[0.08] bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={highlighted ? "text-xs font-black uppercase tracking-[0.18em] text-white/42" : "text-xs font-black uppercase tracking-[0.18em] text-[#777]"}>{note}</p>
        {highlighted && <span className="rounded-full bg-[#FF4D6D] px-3 py-1 text-xs font-black text-white">Popular</span>}
      </div>
      <h3 className="mt-4 font-heading text-3xl font-black tracking-[-0.05em]">{title}</h3>
      <p className="mt-5 font-heading text-5xl font-black tracking-[-0.06em]">{price}<span className="text-base font-bold opacity-50">/mes</span></p>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <p key={item} className={highlighted ? "flex items-center gap-3 text-sm font-bold text-white/72" : "flex items-center gap-3 text-sm font-bold text-[#555]"}>
            <Check size={17} className="shrink-0 text-[#22C55E]" />
            {item}
          </p>
        ))}
      </div>
      <Link href="/registro" className={highlighted ? "mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#FF4D6D] text-sm font-black text-white" : "mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#171717] text-sm font-black text-white"}>
        Comecar agora
      </Link>
    </div>
  );
}

function FAQ() {
  return (
    <section className="bg-[#F1F1EA] px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF4D6D]">FAQ</p>
          <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.05em]">
            Perguntas respondidas antes do usuario procurar o menu.
          </h2>
        </div>
        <div className="grid gap-3">
          {faq.map(([question, answer]) => (
            <div key={question} className="rounded-[8px] border border-black/[0.08] bg-white p-5">
              <h3 className="font-heading text-xl font-black tracking-[-0.035em]">{question}</h3>
              <p className="mt-2 text-sm leading-7 text-[#666]">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#171717] px-5 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF8EA2]">Proxima acao</p>
          <h2 className="mt-4 max-w-4xl font-heading text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            Publique uma loja que explica, vende e entrega sem depender do direct.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/58">
            Comece com um produto simples, cole o link na bio e use o painel para entender o que merece crescer.
          </p>
        </div>
        <Link href="/registro" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-base font-black text-[#171717] transition hover:-translate-y-1 hover:bg-[#FF4D6D] hover:text-white">
          Criar loja gratis
          <ArrowRight className="ml-2" size={18} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0D0D0D] px-5 pb-8 pt-0 text-white">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[8px] border border-white/[0.09] bg-[#151515] shadow-[0_34px_120px_rgba(0,0,0,0.40)]">
        <div className="grid gap-8 border-b border-white/[0.08] p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <BrandLogo textClassName="text-white" imageClassName="size-10" />
            <h2 className="mt-8 max-w-2xl font-heading text-4xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
              Um link que parece loja, vende como checkout e entrega como sistema.
            </h2>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro" className="inline-flex h-12 items-center justify-center rounded-full bg-[#FF4D6D] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff2d55]">
                Criar loja gratis
                <ArrowRight className="ml-2" size={17} />
              </Link>
              <Link href="/lojaexemplo" className="inline-flex h-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.08]">
                Ver exemplo
              </Link>
            </div>
          </div>

          <div className="rounded-[8px] border border-white/[0.08] bg-[#0D0D0D] p-4">
            <div className="overflow-hidden rounded-[8px] bg-[#FAFAF7] p-3 text-[#171717]">
              <div className="h-20 rounded-[8px] bg-[linear-gradient(135deg,#FF4D6D,#F59E0B,#22C55E)]" />
              <div className="mt-3 grid grid-cols-[52px_1fr] gap-3">
                <div className="-mt-8 grid size-14 place-items-center rounded-full border-4 border-[#FAFAF7] bg-[#171717]">
                  <Image src="/logo-pikbio.png" alt="" width={34} height={34} />
                </div>
                <div>
                  <p className="font-heading text-xl font-black tracking-[-0.04em]">Creator Store</p>
                  <p className="text-xs font-bold text-[#777]">3 produtos ativos</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {["Planilha 12 semanas", "Pack editavel", "Mentoria 1h"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-[8px] border border-black/[0.07] bg-white p-3">
                    <span className="text-sm font-black">{item}</span>
                    <span className={index === 0 ? "text-sm font-black text-[#22C55E]" : "text-sm font-black text-[#FF4D6D]"}>
                      {index === 0 ? "R$ 47" : index === 1 ? "R$ 37" : "R$ 197"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="max-w-sm text-sm leading-7 text-white/45">
              Pikbio e uma loja na bio para criadores brasileiros venderem produtos digitais com uma jornada simples e visual.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="https://www.instagram.com/pikbio.app/" target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/55 transition hover:text-white" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://tiktok.com/@pikbio" target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/55 transition hover:text-white" aria-label="TikTok">
                <Music2 size={18} />
              </a>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="font-heading text-sm font-black uppercase tracking-[0.16em] text-white/70">{column.title}</p>
                <div className="mt-4 grid gap-3">
                  {column.links.map((link) => (
                    <Link key={link.href} href={link.href} className="text-sm font-bold text-white/38 transition hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.08] px-6 py-4 text-xs font-bold text-white/32 md:flex-row md:px-8">
          <span>Pikbio. Loja na bio para vender produtos digitais.</span>
          <span>Feito para criadores que querem vender com menos improviso.</span>
        </div>
      </div>
    </footer>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF4D6D]">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#666]">{text}</p>
    </div>
  );
}
