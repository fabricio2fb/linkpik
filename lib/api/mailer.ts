import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (resend) return resend;
  resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAccessEmail(params: {
  buyerEmail: string;
  buyerName: string;
  productTitle: string;
  accessToken: string;
  orderId: string;
}) {
  const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/acesso/${params.accessToken}`;
  const safeName = escapeHtml(params.buyerName);
  const safeTitle = escapeHtml(params.productTitle);

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.buyerEmail,
    subject: `Seu acesso: ${params.productTitle}`,
    html: `
      <h2>Ola, ${safeName}!</h2>
      <p>Seu pagamento foi confirmado. Clique no botao abaixo para acessar seu produto:</p>
      <a href="${accessUrl}" style="
        display: inline-block;
        background: #7c3aed;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
      ">Acessar produto</a>
      <p>Produto: ${safeTitle}</p>
      <p>Este link e pessoal e expira em 7 dias.</p>
      <p>Se voce nao fez esta compra, ignore este email.</p>
      <p style="color:#777;font-size:12px">Pedido: ${params.orderId}</p>
    `,
  });
}

export async function sendPhysicalOrderConfirmedEmail(params: {
  buyerEmail: string;
  buyerName: string;
  productTitle: string;
  statusUrl: string;
}) {
  const safeName = escapeHtml(params.buyerName);
  const safeTitle = escapeHtml(params.productTitle);
  const safeUrl = escapeHtml(params.statusUrl);

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.buyerEmail,
    subject: `Pedido confirmado: ${params.productTitle}`,
    html: `
      <h2>Ola, ${safeName}!</h2>
      <p>Seu pagamento foi confirmado e o vendedor ja pode preparar o envio.</p>
      <a href="${safeUrl}" style="
        display: inline-block;
        background: #FF4D6D;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
      ">Acompanhar meu pedido</a>
      <p>Produto: ${safeTitle}</p>
      <p>Use este link pessoal para acompanhar o status e o codigo de rastreio quando ele for informado.</p>
    `,
  });
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  const safeBody = escapeHtml(params.body);
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: params.subject,
    html: `
      <p>${safeBody}</p>
      <hr/>
      <small>Voce recebeu este email porque tem notificacoes ativas no Pikbio.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes">
        Gerenciar notificacoes
      </a></small>
    `,
  });
}
