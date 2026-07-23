import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Layers,
  MessageSquareQuote,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  WalletCards,
  Zap,
} from "lucide-react";
import HowItWorksFAQ from "@/components/landing/HowItWorksFAQ";
import HowItWorksProductWizard from "@/components/landing/HowItWorksProductWizard";
import HowItWorksReveal from "@/components/landing/HowItWorksReveal";
import HowItWorksSidebar, { type HowItWorksNavItem } from "@/components/landing/HowItWorksSidebar";
import HowItWorksSplitMockup from "@/components/landing/HowItWorksSplitMockup";
import HowItWorksThemePreview from "@/components/landing/HowItWorksThemePreview";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Como Funciona — Pikbio",
  description: "Entenda cada etapa do Pikbio: criação da loja, produto, checkout, webhook, acesso automático e split de pagamento.",
};

const sections: HowItWorksNavItem[] = [
  { id: "inicio", label: "Início" },
  { id: "criando-sua-loja", label: "Criando sua loja" },
  { id: "personalizando-o-visual", label: "Personalizando o visual" },
  { id: "cadastrando-produto", label: "Cadastrando seu primeiro produto" },
  { id: "pagina-produto", label: "Montando a pagina do produto" },
  { id: "experiencia-de-compra", label: "Experiência de compra do cliente" },
  { id: "acesso-pos-compra", label: "Acesso pós-compra" },
  { id: "painel-vendas", label: "Seu painel e vendas" },
  { id: "split", label: "Como funciona o recebimento" },
  { id: "faq", label: "Dúvidas frequentes" },
];

export default function ComoFuncionaPage() {
  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-white">
      <div className="min-w-0 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <HowItWorksSidebar items={sections} />

        <div className="min-w-0 lg:col-start-2">
          <section id="inicio" className="relative overflow-hidden px-5 pb-20 pt-20 lg:px-10 lg:pt-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,77,109,0.18),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.10),transparent_28%)]" />
            <HowItWorksReveal className="relative z-10 mx-auto max-w-5xl">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Entendendo a plataforma</p>
              <h1 className="mt-5 max-w-4xl break-words font-heading text-5xl font-black leading-[0.95] tracking-[-0.075em] text-white md:text-7xl">
                Transparência do clique à venda.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/56">
                Veja exatamente como o Pikbio funciona em cada etapa: do cadastro e criação da loja até a confirmação automática do pagamento e o dinheiro indo para a conta do criador.
              </p>
              <Link href="/registro" className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_24px_80px_rgba(255,77,109,0.35)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]">
                Criar minha loja
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </HowItWorksReveal>
          </section>

          <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-20 px-5 pb-20 lg:px-10">
            <InfoSection
              id="criando-sua-loja"
              eyebrow="01 / Cadastro"
              title="Criando sua loja"
              text="O início é simples: você cria a conta com e-mail, escolhe seu username e o Pikbio gera automaticamente o link público da sua loja. Esse endereço vira o link que você cola na bio."
              icon={<Store size={20} />}
            >
                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <FeatureList items={["Cadastro com e-mail", "Username público", "Link gerado automaticamente", "Loja pronta para receber produtos"]} />
                {/* TODO: substituir por screenshot real do formulário de cadastro */}
                <Placeholder title="Screenshot do cadastro" text="Área reservada para print real da tela de registro e escolha de username." />
              </div>
            </InfoSection>

            <section id="personalizando-o-visual" className="scroll-mt-24">
              <HowItWorksReveal>
                <HowItWorksThemePreview />
              </HowItWorksReveal>
            </section>

            <InfoSection
              id="cadastrando-produto"
              eyebrow="03 / Produto"
              title="Cadastrando seu primeiro produto"
              text="O cadastro segue o wizard real do Pikbio em 4 etapas: tipo, conteúdo, precificação e entrega. O objetivo é guiar o criador sem esconder campos importantes."
              icon={<ShoppingBag size={20} />}
            >
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
                <FeatureList items={["Infoproduto ou físico", "Descrição, capa e itens incluídos", "Preço, preço original e upsell", "Entrega digital ou dados de envio"]} />
                <HowItWorksProductWizard />
              </div>
            </InfoSection>

            <InfoSection
              id="pagina-produto"
              eyebrow="04 / Pagina do produto"
              title="Montando a pagina do seu produto"
              text="Cada produto pode ter sua propria pagina, montada por secoes. Voce escolhe blocos como texto, imagem, checklist, depoimentos, FAQ, tabela e video, preenche os campos e organiza tudo com botoes de subir e descer."
              icon={<Layers size={20} />}
            >
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <FeatureList items={["Adicionar secoes com um clique, sem arrastar nada", "Botao de compra em qualquer ponto da pagina", "Mais de um botao de compra quando fizer sentido", "Personalizacao imediata ao criar ou depois pela lista de produtos"]} />
                <ProductPageBuilderMockup />
              </div>
            </InfoSection>

            <InfoSection
              id="experiencia-de-compra"
              eyebrow="05 / Checkout e confirmacao"
              title="Experiência de compra do cliente"
              text="O comprador clica no produto, ve a pagina criada por secoes, toca em Comprar e o checkout abre no proprio site. PIX aparece sempre inline, com QR Code e copia e cola. Cartao e boleto podem abrir uma tela segura do processador, dependendo do gateway configurado."
              icon={<CreditCard size={20} />}
            >
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <FeatureList items={ ["Pagina do produto antes do checkout", "PIX inline no proprio site", "Cartao e boleto podem abrir tela segura do processador", "Confirmacao automatica via webhook, sem aprovacao manual"] } />
                {/* TODO: substituir por screenshot real do modal de checkout */}
                <CheckoutMockup />
              </div>
              <div className="mt-6 rounded-[28px] border border-[#22C55E]/20 bg-[#22C55E]/10 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#22C55E]/14 text-[#22C55E]">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-black text-white">Confirmacao automatica, sem comprovante manual</h3>
                    <p className="mt-2 text-sm leading-7 text-white/56">
                      PIX costuma confirmar em segundos. Cartao e boleto seguem o prazo normal do processador. Assim que o gateway envia o webhook, o pedido muda de status e o acesso e liberado sem o criador precisar aprovar nada.
                    </p>
                  </div>
                </div>
              </div>
            </InfoSection>

            <InfoSection
              id="acesso-pos-compra"
              eyebrow="06 / Entrega"
              title="Acesso pós-compra"
              text="Produtos digitais geram um link seguro em /acesso/[token], enviado por e-mail ao comprador. Produtos físicos usam o acompanhamento de pedido e rastreio quando informado pelo criador."
              icon={<Download size={20} />}
            >
              <div className="grid gap-6 md:grid-cols-2">
                {/* TODO: substituir por screenshot real da página /acesso/[token] */}
                <AccessCard icon={<Mail size={20} />} title="Produto digital" text="E-mail com link seguro de acesso, download ou instruções configuradas no produto." />
                {/* TODO: substituir por screenshot real da página de rastreio físico */}
                <AccessCard icon={<Truck size={20} />} title="Produto físico" text="Página de status do pedido com endereço, frete e código de rastreio quando disponível." />
              </div>
            </InfoSection>

            <InfoSection
              id="painel-vendas"
              eyebrow="07 / Dashboard"
              title="Seu painel e vendas"
              text="O dashboard do criador concentra receita, pedidos, funil de conversão, analytics, gráfico de vendas e produtos com melhor desempenho."
              icon={<BarChart3 size={20} />}
            >
              {/* TODO: substituir por screenshot real do dashboard do criador */}
              <DashboardMockup />
            </InfoSection>

            <InfoSection
              id="split"
              eyebrow="08 / Recebimento"
              title="Como funciona o recebimento"
              text="O valor da venda e dividido automaticamente no momento do pagamento. O dinheiro vai direto para a conta do criador configurada no gateway, com a taxa Pikbio descontada no split."
              icon={<WalletCards size={20} />}
            >
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
                <div className="rounded-[28px] border border-[#FF4D6D]/24 bg-[#FF4D6D]/10 p-6">
                  <h3 className="font-heading text-2xl font-black tracking-[-0.04em] text-white">A Pikbio não custodia o valor da venda.</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    O gateway processa o pagamento e separa automaticamente o valor do criador e a taxa da plataforma. No Free, a taxa é 10%. No Pro, 5%.
                  </p>
                </div>
                <HowItWorksSplitMockup />
              </div>
            </InfoSection>

            <InfoSection
              id="faq"
              eyebrow="09 / FAQ"
              title="Dúvidas frequentes"
              text="Respostas diretas sobre cadastro, taxas, recebimento, confirmação automática e tipos de produto."
              icon={<Sparkles size={20} />}
            >
              <HowItWorksFAQ />
            </InfoSection>
          </div>

          <section className="relative overflow-hidden bg-[#070707] px-5 py-24 text-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4D6D]/10 blur-[130px]" />
            <HowItWorksReveal className="relative z-10 mx-auto max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Próxima ação</p>
              <h2 className="mt-4 break-words font-heading text-5xl font-black leading-tight tracking-[-0.075em] text-white md:text-6xl">
                Pare de vender pelo direct.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/52">
                Monte sua loja, conecte o checkout e deixe o fluxo de venda organizado do clique ao acesso.
              </p>
              <Link href="/registro" className="mt-9 inline-flex h-14 items-center rounded-full bg-[#FF4D6D] px-8 text-base font-black text-white shadow-[0_24px_80px_rgba(255,77,109,0.35)] transition hover:-translate-y-0.5 hover:bg-[#FF2D55]">
                Criar minha loja
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </HowItWorksReveal>
          </section>

          <LandingFooter />
        </div>
      </div>
    </main>
  );
}

function InfoSection({ id, eyebrow, title, text, icon, children }: { id: string; eyebrow: string; title: string; text: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <HowItWorksReveal>
        <div className="mb-7 flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">{icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF4D6D]">{eyebrow}</p>
            <h2 className="mt-3 max-w-full break-words font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">{title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/52">{text}</p>
          </div>
        </div>
        {children}
      </HowItWorksReveal>
    </section>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-sm font-bold text-white/72 transition hover:-translate-y-0.5 hover:border-white/[0.14]">
          <Check className="shrink-0 text-[#22C55E]" size={17} />
          {item}
        </div>
      ))}
    </div>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/[0.16] bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-[#FF4D6D]/35">
      <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/[0.08] bg-black/30 text-center">
        <div>
          <PackageCheck className="mx-auto text-[#FF4D6D]" size={28} />
          <p className="mt-3 font-heading text-lg font-black text-white">{title}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/42">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ProductPageBuilderMockup() {
  return (
    <div className="min-w-0 rounded-[32px] border border-white/[0.08] bg-[#101010] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.42)] transition hover:-translate-y-1 hover:border-[#FF4D6D]/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Construtor de pagina</p>
          <h3 className="mt-1 font-heading text-xl font-black text-white">Treino em casa</h3>
        </div>
        <span className="rounded-full bg-[#FF4D6D]/12 px-3 py-1 text-[10px] font-black uppercase text-[#FF4D6D]">ao vivo</span>
      </div>

      <div className="mx-auto w-full max-w-[300px] rounded-[34px] border border-white/[0.10] bg-black p-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
        <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0A0A0A]">
          <div className="h-28 bg-[linear-gradient(135deg,#FF4D6D,#7C3AED)]" />
          <div className="grid gap-3 p-4">
            <div className="rounded-2xl border border-[#FF4D6D]/28 bg-[#FF4D6D]/10 p-3">
              <p className="font-heading text-lg font-black text-white">Plano completo</p>
              <p className="mt-1 text-xs leading-5 text-white/46">Pagina montada com secoes independentes.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">Checklist</p>
              {["Acesso imediato", "PDF + videos", "Atualizacoes inclusas"].map((item) => (
                <div key={item} className="mt-2 flex items-center gap-2 text-xs font-bold text-white/72">
                  <Check size={14} className="text-[#22C55E]" />
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FF4D6D]/14 text-[#FF4D6D]">
                  <MessageSquareQuote size={15} />
                </span>
                <div>
                  <p className="text-xs font-black text-white">Depoimento</p>
                  <p className="mt-1 text-xs leading-5 text-white/46">"Ficou facil entender o que eu estava comprando."</p>
                </div>
              </div>
            </div>

            <div className="grid h-11 place-items-center rounded-full bg-[#FF4D6D] text-xs font-black text-white">Comprar agora</div>
            <div className="grid h-11 place-items-center rounded-2xl border border-dashed border-white/[0.16] text-xs font-black text-white/44">+ Adicionar secao</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutMockup() {
  return (
    <div className="min-w-0 rounded-[28px] border border-white/[0.08] bg-[#101010] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] transition hover:-translate-y-1 hover:border-[#FF4D6D]/30">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Finalizar compra</p>
          <h3 className="mt-1 font-heading text-lg font-black text-white">Planilha 12 semanas</h3>
        </div>
        <span className="font-heading text-xl font-black text-[#FF4D6D]">R$ 47</span>
      </div>
      <div className="mt-5 grid gap-3">
        {["Nome completo", "Email", "CPF"].map((field) => (
          <div key={field} className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm font-bold text-white/36">{field}</div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {[{ icon: QrCode, label: "PIX" }, { icon: CreditCard, label: "Cartão" }, { icon: MapPin, label: "Boleto" }].map((item, index) => (
            <div key={item.label} className={`rounded-xl border p-3 text-center text-xs font-black ${index === 0 ? "border-[#FF4D6D] bg-[#FF4D6D]/12 text-white" : "border-white/[0.08] bg-white/[0.035] text-white/42"}`}>
              <item.icon className="mx-auto mb-2" size={18} />
              {item.label}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[#FF4D6D]/28 bg-[#FF4D6D]/10 p-4">
          <div className="mx-auto grid size-24 place-items-center rounded-xl bg-white text-[#111]">
            <QrCode size={48} />
          </div>
          <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-center text-[11px] font-black text-white/50">000201... PIX copia e cola</div>
        </div>
        <div className="grid h-12 place-items-center rounded-full bg-[#FF4D6D] text-sm font-black text-white">Confirmar pedido</div>
      </div>
    </div>
  );
}

function AccessCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="min-w-0 rounded-[28px] border border-white/[0.08] bg-[#101010] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-[#FF4D6D]/30">
      <span className="grid size-11 place-items-center rounded-2xl bg-[#FF4D6D]/12 text-[#FF4D6D]">{icon}</span>
      <h3 className="mt-5 font-heading text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/52">{text}</p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="min-w-0 rounded-[32px] border border-white/[0.08] bg-[#101010] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.42)] transition hover:-translate-y-1 hover:border-[#FF4D6D]/26">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Dashboard</p>
          <h3 className="mt-1 font-heading text-xl font-black text-white">Resumo da loja</h3>
        </div>
        <span className="rounded-full bg-[#22C55E]/12 px-3 py-1 text-[10px] font-black uppercase text-[#22C55E]">online</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Receita", "R$ 4.820"],
          ["Pedidos", "124"],
          ["Conversão", "3,2%"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{label}</p>
            <p className="mt-2 font-heading text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 rounded-2xl border border-white/[0.07] bg-black/30 p-4">
        {[62, 84, 48, 92, 70, 98, 76].map((width, index) => (
          <div key={index} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-3">
            <span className="text-[10px] font-black text-white/34">D{index + 1}</span>
            <span className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <span className="block h-full rounded-full bg-[#FF4D6D]" style={{ width: `${width}%` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
