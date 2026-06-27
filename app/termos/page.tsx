import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Termos de Uso — Pikbio",
  description: "Termos e condições de uso da plataforma Pikbio.",
};

const sections = [
  {
    title: "1. O Pikbio",
    content:
      'O Pikbio (pik.bio) é uma plataforma de tecnologia que permite a criadores de conteúdo montar uma loja virtual para vender produtos digitais e físicos. O Pikbio é um serviço oferecido ao público brasileiro, podendo fornecer informações adicionais de identificação do operador mediante solicitação justificada, nos termos da lei. Canal oficial de contato: pikbiosite@gmail.com.',
  },
  {
    title: "2. Definições",
    content:
      '"Criador" é o usuário que cadastra produtos na plataforma. "Comprador" é quem adquire produtos através da loja de um criador. "Produto Digital" são e-books, cursos, planilhas, mentorias e qualquer conteúdo entregue eletronicamente. "Produto Físico" são itens que exigem frete e entrega postal.',
  },
  {
    title: "3. Cadastro",
    content:
      "Para usar o Pikbio como criador, é necessário criar uma conta com e-mail e senha. O uso é proibido para menores de 18 anos. O criador é responsável pela segurança de sua senha e por todas as atividades na conta.",
  },
  {
    title: "4. Responsabilidade do Criador",
    content:
      "O criador é o único responsável pelos produtos que anuncia — conteúdo, qualidade, legalidade e entrega. O Pikbio não realiza curadoria prévia dos produtos cadastrados. É proibido vender produtos ilegais, falsificados, golpes ou qualquer atividade vedada pela lei brasileira. Contas que violarem estas regras podem ser suspensas.",
  },
  {
    title: "5. Pagamentos e taxas",
    content:
      "Os pagamentos são processados pelo Mercado Pago e Efí Bank. O Pikbio não recebe nem custodiar valores — o dinheiro das vendas é direcionado automaticamente à conta do criador, descontada a comissão do Pikbio, sem transitar por conta do Pikbio. A comissão é de 10% (plano Free) ou 5% (plano Pro). O plano Pro custa R$ 29/mês e pode ser cancelado a qualquer momento.",
  },
  {
    title: "6. Produtos físicos",
    content:
      "Para produtos físicos, o criador é responsável por estoque, embalagem e postagem. O frete é calculado por integração com serviços de transporte (PAC, Sedex, Jadlog).",
  },
  {
    title: "7. Dados pessoais",
    content:
      "O tratamento de dados pessoais é detalhado na nossa Política de Privacidade, parte integrante destes Termos. Para solicitar exclusão ou exportação de dados, acesse a página de solicitação de dados.",
  },
  {
    title: "8. Suspensão e encerramento",
    content:
      "O Pikbio pode suspender ou encerrar contas que violem estes Termos. O criador pode encerrar sua conta a qualquer momento. Dados financeiros de vendas realizadas são mantidos por obrigação legal, mesmo após o encerramento.",
  },
  {
    title: "9. Limitação de responsabilidade",
    content:
      "O Pikbio não se responsabiliza por: (a) conteúdo e produtos dos criadores; (b) indisponibilidade temporária da plataforma; (c) perdas por uso indevido de credenciais pelo próprio usuário.",
  },
  {
    title: "10. Alterações",
    content:
      "Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas com antecedência.",
  },
  {
    title: "11. Legislação aplicável",
    content:
      "Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.",
  },
  {
    title: "12. Contato",
    content: "Dúvidas sobre estes Termos: pikbiosite@gmail.com.",
  },
];

export default function TermosPage() {
  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <section className="px-5 pt-40 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Legal</p>
            <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
              Termos de Uso
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
              Última atualização: junho de 2026.
            </p>
          </div>

          <div className="mt-16 space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-white">{section.title}</h2>
                <p className="mt-3 text-base leading-7 text-white/52">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
