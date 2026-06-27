import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Link2,
  LockKeyhole,
  MousePointerClick,
  Palette,
  Play,
  Sparkles,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Pikbio - loja na bio para vender infoprodutos",
  description: "Crie sua loja na bio, venda produtos digitais e entregue acesso automaticamente.",
  robots: {
    index: false,
    follow: false,
  },
};

const flow = [
  { icon: Store, title: "Crie a loja", text: "Perfil, banner, vídeo, links e visual." },
  { icon: FileText, title: "Cadastre o produto", text: "Imagem, preço, descrição e entrega." },
  { icon: CreditCard, title: "Receba o pagamento", text: "Checkout integrado para o comprador." },
  { icon: LockKeyhole, title: "Libere o acesso", text: "Link ou arquivo entregue após aprovação." },
];

const products = [
  { title: "Pack de Templates", price: "R$ 29,90", color: "#FF4D6D", icon: FileText },
  { title: "Curso Express", price: "R$ 97,00", color: "#38BDF8", icon: Play },
  { title: "Planilha Pro", price: "R$ 19,90", color: "#22C55E", icon: Download },
];

const dashboardStats = [
  ["R$ 4.890", "receita"],
  ["124", "vendas"],
  ["8", "produtos"],
  ["98%", "entregas"],
];

export default function LandingPage2() {
  return (
    <main className="site-light-landing min-h-screen bg-[#F7F8FB] text-[#111827]">
      <Header />
      <Hero />
      <VisualFlow />
      <CreatorScreen />
      <BuyerScreen />
      <Pricing />
      <FinalCta />
    </main>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#050505]/88 px-4 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <BrandLogo textClassName="text-white" />
        <nav className="hidden items-center gap-7 text-sm font-bold text-white/58 md:flex">
          <a href="#como-funciona" className="transition hover:text-white">Como funciona</a>
          <a href="#painel" className="transition hover:text-white">Painel</a>
          <a href="#precos" className="transition hover:text-white">Preços</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-white/58 transition hover:text-white sm:block">
            Entrar
          </Link>
          <Link href="/registro" className="inline-flex h-10 items-center justify-center rounded-full bg-[#FF4D6D] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff2d55]">
            Criar loja
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] px-5 pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 pb-14 lg:grid-cols-[0.92fr_1.08fr] lg:pb-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 px-3 py-2 text-xs font-black uppercase text-[#FF9AAF]">
            <Sparkles size={15} />
            Loja na bio para criadores
          </div>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-black leading-[0.98] text-white md:text-7xl">
            Sua bio vira uma loja que vende.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/64">
            Crie a vitrine, cobre pelo checkout e entregue o acesso digital automaticamente.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registro" className="group inline-flex h-14 items-center justify-center rounded-full bg-[#FF4D6D] px-7 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#ff2d55]">
              Começar agora
              <ArrowRight className="ml-2 transition group-hover:translate-x-1" size={18} />
            </Link>
            <Link href="/lojaexemplo" className="inline-flex h-14 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] px-7 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/[0.08]">
              Ver loja exemplo
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <MiniMetric value="1 link" label="para vender" />
            <MiniMetric value="10 min" label="para publicar" />
            <MiniMetric value="24/7" label="loja online" />
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="font-heading text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-white/42">{label}</p>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto min-h-[620px] w-full max-w-[720px]">
      <div className="absolute left-0 top-10 hidden w-[410px] rounded-[28px] border border-white/[0.10] bg-[#0f0f0f] p-4 shadow-[0_36px_110px_rgba(0,0,0,0.62)] md:block">
        <DashboardPanel compact />
      </div>

      <div className="absolute right-0 top-0 w-[310px] rounded-[38px] border border-white/[0.14] bg-[#191919] p-3 shadow-[0_42px_130px_rgba(0,0,0,0.7)] sm:w-[350px]">
        <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#080808]">
          <div className="h-28 bg-[linear-gradient(135deg,#FF4D6D,#7C3AED_58%,#111)]" />
          <div className="px-5 pb-5">
            <div className="-mt-9 grid size-18 place-items-center rounded-full border-4 border-[#080808] bg-[#FF4D6D]">
              <Image src="/logo-pikbio.png" alt="" width={46} height={46} className="object-contain" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-black">Ana Creator</h2>
            <p className="mt-1 text-sm text-white/55">Templates, aulas e guias.</p>
            <div className="mt-5 grid gap-3">
              {products.map((product) => (
                <ProductRow key={product.title} {...product} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-4 w-[330px] rounded-[26px] border border-white/[0.10] bg-[#101010] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:left-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-white/38">Checkout</p>
            <h3 className="mt-1 font-heading text-xl font-black">Pack de Templates</h3>
          </div>
          <span className="rounded-full bg-[#22C55E]/12 px-3 py-2 text-xs font-black text-[#22C55E]">Pago</span>
        </div>
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/52">Produto</span>
            <strong>R$ 29,90</strong>
          </div>
          <div className="mt-3 h-11 rounded-full bg-[#FF4D6D] text-center text-sm font-black leading-[44px]">
            Acesso liberado
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ title, price, color, icon: Icon }: { title: string; price: string; color: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}22`, color }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{title}</p>
        <p className="mt-1 text-xs text-white/42">Entrega automática</p>
      </div>
      <p className="text-sm font-black" style={{ color }}>{price}</p>
    </div>
  );
}

function VisualFlow() {
  return (
    <section id="como-funciona" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Como funciona" title="O comprador entende. O criador controla." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {flow.map((item, index) => (
            <FlowCard key={item.title} number={index + 1} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowCard({ number, icon: Icon, title, text }: { number: number; icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">
          <Icon size={22} />
        </div>
        <span className="font-heading text-3xl font-black text-white/16">0{number}</span>
      </div>
      <h3 className="mt-7 font-heading text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}

function CreatorScreen() {
  return (
    <section id="painel" className="border-y border-white/[0.08] bg-[#0a0a0a] px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[#FF8EA2]">Painel do criador</p>
          <h2 className="mt-4 font-heading text-4xl font-black leading-tight md:text-5xl">
            Veja vendas, produtos e acessos em uma tela.
          </h2>
          <div className="mt-7 grid gap-3">
            <Pill icon={BarChart3} text="Receita, vendas e conversão" />
            <Pill icon={Palette} text="Editor visual da loja" />
            <Pill icon={Zap} text="Entrega digital automática" />
          </div>
        </div>
        <DashboardPanel />
      </div>
    </section>
  );
}

function DashboardPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#101010] p-4 shadow-[0_34px_100px_rgba(0,0,0,0.48)]">
      <div className="rounded-[22px] border border-white/[0.08] bg-[#080808] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-white/38">Dashboard</p>
            <h3 className="mt-1 font-heading text-2xl font-black">Visão geral</h3>
          </div>
          <span className="rounded-full bg-[#22C55E]/12 px-3 py-2 text-xs font-black text-[#22C55E]">ativo</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dashboardStats.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <p className="font-heading text-xl font-black">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase text-white/42">{label}</p>
            </div>
          ))}
        </div>
        {!compact && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08]">
            {[
              ["Pack de Templates", "R$ 29,90", "Pago"],
              ["Curso Express", "R$ 97,00", "Pago"],
              ["Planilha Pro", "R$ 19,90", "Pendente"],
            ].map(([product, value, status]) => (
              <div key={product} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[0.06] p-4 last:border-b-0">
                <p className="min-w-0 truncate text-sm font-bold">{product}</p>
                <p className="text-sm font-black text-[#FF4D6D]">{value}</p>
                <p className={status === "Pago" ? "text-sm font-black text-[#22C55E]" : "text-sm font-black text-[#F59E0B]"}>
                  {status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm font-bold text-white/72">
      <Icon size={18} className="text-[#FF4D6D]" />
      {text}
    </div>
  );
}

function BuyerScreen() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="grid gap-4 md:grid-cols-2">
          <VisualCard title="Página da loja" icon={Store}>
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#090909] p-4">
              <div className="h-20 rounded-xl bg-[linear-gradient(135deg,#FF4D6D,#111)]" />
              <div className="mt-4 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#FF4D6D]">
                  <Image src="/logo-pikbio.png" alt="" width={30} height={30} />
                </div>
                <div>
                  <p className="font-black">Ana Creator</p>
                  <p className="text-xs text-white/45">3 produtos publicados</p>
                </div>
              </div>
            </div>
          </VisualCard>
          <VisualCard title="Checkout" icon={CreditCard}>
            <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.08] bg-[#090909] p-4">
              <div className="h-3 rounded-full bg-white/10" />
              <div className="h-3 w-4/5 rounded-full bg-white/10" />
              <div className="mt-2 rounded-full bg-[#FF4D6D] py-3 text-center text-sm font-black">Comprar</div>
            </div>
          </VisualCard>
          <VisualCard title="Confirmação" icon={BadgeCheck}>
            <div className="mt-5 rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-[#22C55E]">
                <CheckCircle2 size={18} />
                Pagamento aprovado
              </p>
              <p className="mt-3 text-xs text-white/52">Acesso enviado para o comprador.</p>
            </div>
          </VisualCard>
          <VisualCard title="Acesso" icon={LockKeyhole}>
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#090909] p-4">
              <p className="text-xs font-black uppercase text-white/35">Link seguro</p>
              <div className="mt-3 rounded-full bg-white/[0.06] px-4 py-3 text-xs font-bold text-white/58">/acesso/pkb••••</div>
            </div>
          </VisualCard>
        </div>
        <div>
          <p className="text-sm font-black uppercase text-[#FF8EA2]">Experiência do comprador</p>
          <h2 className="mt-4 font-heading text-4xl font-black leading-tight md:text-5xl">
            Compra simples. Entrega clara.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/60">
            A pessoa entra, escolhe o produto, paga e recebe o acesso. Sem precisar perguntar no direct.
          </p>
          <Link href="/registro" className="mt-8 inline-flex h-13 items-center justify-center rounded-full bg-[#FF4D6D] px-7 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#ff2d55]">
            Criar minha loja
            <ArrowRight className="ml-2" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function VisualCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-[#FF4D6D]/12 text-[#FF4D6D]">
          <Icon size={18} />
        </div>
        <h3 className="font-heading text-lg font-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Pricing() {
  return (
    <section id="precos" className="border-y border-white/[0.08] bg-[#0a0a0a] px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Preços" title="Comece grátis. Evolua quando vender mais." />
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          <PriceCard title="Free" price="R$ 0" items={["3 produtos", "5 links", "Checkout", "10% de comissão"]} />
          <PriceCard highlighted title="Pro" price="R$ 29,90" items={["Produtos ilimitados", "Upsell", "Analytics maior", "7% de comissão"]} />
        </div>
      </div>
    </section>
  );
}

function PriceCard({ title, price, items, highlighted = false }: { title: string; price: string; items: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-[28px] border p-7 ${highlighted ? "border-[#FF4D6D]/42 bg-[#FF4D6D]/12" : "border-white/[0.08] bg-white/[0.035]"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase text-white/48">{title}</p>
        {highlighted && <span className="rounded-full bg-[#FF4D6D] px-3 py-1 text-xs font-black">Popular</span>}
      </div>
      <p className="mt-5 font-heading text-5xl font-black">{price}</p>
      <div className="mt-7 grid gap-3">
        {items.map((item) => (
          <p key={item} className="flex items-center gap-3 text-sm font-bold text-white/72">
            <CheckCircle2 size={18} className="text-[#22C55E]" />
            {item}
          </p>
        ))}
      </div>
      <Link href="/registro" className={`mt-8 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-black transition hover:-translate-y-0.5 ${highlighted ? "bg-[#FF4D6D] text-white hover:bg-[#ff2d55]" : "border border-white/[0.12] bg-white/[0.05] text-white hover:bg-white/[0.08]"}`}>
        Começar
      </Link>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[34px] border border-white/[0.10] bg-[#101010] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="text-sm font-black uppercase text-[#FF8EA2]">Pronto para publicar?</p>
          <h2 className="mt-3 font-heading text-4xl font-black leading-tight md:text-5xl">
            Coloque seu primeiro produto no ar.
          </h2>
        </div>
        <Link href="/registro" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-[#FF4D6D] hover:text-white">
          Criar loja grátis
          <ArrowRight className="ml-2" size={18} />
        </Link>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-black uppercase text-[#FF8EA2]">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-4xl font-black leading-tight md:text-5xl">{title}</h2>
    </div>
  );
}
