import { Resend } from "resend";
import {
  accessEmailHtml,
  accessEmailText,
  notificationHtml,
  notificationText,
  physicalOrderHtml,
  physicalOrderText,
  welcomeEmailHtml,
  welcomeEmailText,
} from "@/lib/api/email-templates";

let resend: Resend | null = null;

function getResend() {
  if (resend) return resend;
  resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

export async function sendAccessEmail(params: {
  buyerEmail: string;
  buyerName: string;
  productTitle: string;
  accessToken: string;
  orderId: string;
}) {
  const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/acesso/${params.accessToken}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.buyerEmail,
    subject: `Seu acesso: ${params.productTitle}`,
    html: accessEmailHtml({
      buyerName: params.buyerName,
      productTitle: params.productTitle,
      accessUrl,
      orderId: params.orderId,
    }),
    text: accessEmailText({
      buyerName: params.buyerName,
      productTitle: params.productTitle,
      accessUrl,
      orderId: params.orderId,
    }),
  });
}

export async function sendPhysicalOrderConfirmedEmail(params: {
  buyerEmail: string;
  buyerName: string;
  productTitle: string;
  statusUrl: string;
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.buyerEmail,
    subject: `Pedido confirmado: ${params.productTitle}`,
    html: physicalOrderHtml({
      buyerName: params.buyerName,
      productTitle: params.productTitle,
      statusUrl: params.statusUrl,
    }),
    text: physicalOrderText({
      buyerName: params.buyerName,
      productTitle: params.productTitle,
      statusUrl: params.statusUrl,
    }),
  });
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: params.subject,
    html: notificationHtml(params),
    text: notificationText(params),
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  username: string;
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: "Bem-vindo ao Pikbio!",
    html: welcomeEmailHtml({ name: params.name, username: params.username }),
    text: welcomeEmailText({ name: params.name, username: params.username }),
  });
}
