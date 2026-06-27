import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Política de Privacidade — Pikbio",
  description: "Política de privacidade e proteção de dados da plataforma Pikbio.",
};

const sections = [
  {
    title: "1. Quem trata seus dados",
    content: (
      <p>
        O Pikbio (pik.bio) é o controlador dos dados pessoais tratados nesta plataforma. Para assuntos
        relacionados à privacidade, o canal oficial é o e-mail{" "}
        <strong>pikbiosite@gmail.com</strong> ou o formulário em{" "}
        <Link href="/privacidade/solicitar" className="text-[#FF4D6D] underline underline-offset-2">
          pik.bio/privacidade/solicitar
        </Link>.
      </p>
    ),
  },
  {
    title: "2. Dados que coletamos",
    content: (
      <>
        <p>
          <strong>De criadores:</strong> nome, e-mail, nome de usuário, foto, biografia e dados bancários
          para recebimento de vendas (armazenados de forma protegida).
        </p>
        <p className="mt-4">
          <strong>De compradores:</strong> nome, e-mail e CPF (armazenado de forma protegida). Para
          produtos físicos: telefone e endereço de entrega completo.
        </p>
        <p className="mt-4">
          <strong>Navegação:</strong> endereço IP (anonimizado) para métricas de acesso.
        </p>
      </>
    ),
  },
  {
    title: "3. Para que usamos seus dados",
    content: (
      <ul className="list-inside list-disc space-y-1">
        <li>Processar pedidos, pagamentos e entregas</li>
        <li>Enviar e-mails transacionais (confirmação de compra, link de acesso)</li>
        <li>Prevenir fraude e abuso</li>
        <li>Cumprir obrigações legais e fiscais</li>
        <li>Gerar métricas de uso para os criadores</li>
      </ul>
    ),
  },
  {
    title: "4. Compartilhamento de dados",
    content: (
      <>
        <p>
          Para operar a plataforma, utilizamos provedores terceiros de hospedagem, armazenamento de
          imagens, envio de e-mail e processamento de pagamento. Os processadores de pagamento visíveis
          ao usuário são <strong>Mercado Pago</strong> e <strong>Efí Bank</strong>. Seus dados são
          compartilhados com eles apenas para processar a transação.
        </p>
        <p className="mt-4">
          Não vendemos dados pessoais a terceiros para publicidade.
        </p>
      </>
    ),
  },
  {
    title: "5. Cookies e rastreamento",
    content: (
      <p>
        As lojas dos criadores podem utilizar pixels de rastreamento (Meta Pixel, Google Analytics,
        TikTok Pixel) caso o criador opte por configurá-los. Esses pixels coletam dados de navegação
        para remarketing e análise de conversão, conforme as políticas de cada plataforma.
      </p>
    ),
  },
  {
    title: "6. Retenção e exclusão",
    content: (
      <>
        <p>
          Dados financeiros (registros de pedidos e valores) são mantidos por 5 anos conforme obrigação
          legal. Ao solicitar a exclusão de dados, realizamos a anonimização dos dados identificáveis,
          preservando apenas os registros financeiros exigidos por lei.
        </p>
        <p className="mt-4">
          Para solicitar exclusão ou exportação, acesse{" "}
          <Link href="/privacidade/solicitar" className="text-[#FF4D6D] underline underline-offset-2">
            pik.bio/privacidade/solicitar
          </Link>. Processamos em até 15 dias úteis.
        </p>
      </>
    ),
  },
  {
    title: "7. Seus direitos (LGPD)",
    content: (
      <>
        <p>Você tem direito a:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Confirmar se tratamos seus dados</li>
          <li>Acessar os dados que temos sobre você</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Solicitar anonimização ou eliminação</li>
          <li>Solicitar portabilidade</li>
          <li>Revogar consentimento</li>
          <li>Reclamar à Autoridade Nacional de Proteção de Dados (ANPD)</li>
        </ul>
        <p className="mt-4">
          Exercite seus direitos em{" "}
          <Link href="/privacidade/solicitar" className="text-[#FF4D6D] underline underline-offset-2">
            pik.bio/privacidade/solicitar
          </Link>.
        </p>
      </>
    ),
  },
  {
    title: "8. Segurança",
    content: (
      <p>
        Adotamos medidas como criptografia de senhas, proteção de dados sensíveis e autenticação
        multifator para acesso administrativo. Nenhum sistema é 100% seguro; em caso de incidente
        relevante, notificaremos conforme a LGPD.
      </p>
    ),
  },
  {
    title: "9. Menores",
    content: (
      <p>
        O Pikbio não é direcionado a menores de 18 anos. Caso identifiquemos cadastro de menor, a
        conta será suspensa e os dados eliminados.
      </p>
    ),
  },
  {
    title: "10. Contato",
    content: (
      <p>
        Dúvidas sobre esta Política: <strong>pikbiosite@gmail.com</strong>.
      </p>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <main className="site-light-landing min-h-screen bg-[#070707] text-[#111827]">
      <LandingNav />

      <section className="px-5 pt-40 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FF4D6D]">Legal</p>
            <h1 className="mt-4 font-heading text-4xl font-black tracking-[-0.055em] text-white md:text-5xl">
              Política de Privacidade
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52">
              Última atualização: junho de 2026.
            </p>
          </div>

          <div className="mt-16 space-y-10">
            {sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-white">{section.title}</h2>
                <div className="mt-3 text-base leading-7 text-white/52">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
