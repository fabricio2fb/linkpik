function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safe(value: string | undefined | null): string {
  return escapeHtml(value ?? "");
}

type AccessEmailData = {
  buyerName: string;
  productTitle: string;
  accessUrl: string;
  orderId: string;
};

export function accessEmailHtml(data: AccessEmailData): string {
  const name = safe(data.buyerName);
  const title = safe(data.productTitle);
  const url = safe(data.accessUrl);
  const orderId = safe(data.orderId);
  const appUrl = safe(process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio");

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header escuro com logo + nome -->
        <tr>
          <td align="center" style="background:#0a0a0a;padding:24px 24px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <img src="${appUrl}/logo-pikbio.png" alt="" width="32" height="32" style="display:block;border:0;width:32px;height:32px;" />
                </td>
                <td valign="middle" style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Pikbio<span style="color:#FF4D6D;">.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Banner rosa de destaque -->
        <tr>
          <td align="center" style="background:#FF4D6D;padding:32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-size:40px;line-height:1;">&#128274;</td>
              </tr>
              <tr>
                <td align="center" style="padding-top:12px;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Acesso Liberado
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Corpo branco -->
        <tr>
          <td style="padding:32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size:16px;color:#333333;line-height:1.6;">
                  Ola, <strong>${name}</strong>!
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:15px;color:#555555;line-height:1.6;">
                  Seu pagamento foi confirmado. Clique no botao abaixo para acessar seu produto:
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:24px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background:#FF4D6D;border-radius:6px;">
                        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">Acessar produto</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;font-size:14px;color:#888888;line-height:1.5;">
                  <strong style="color:#333333;">Produto:</strong> ${title}
                </td>
              </tr>
              <tr>
                <td style="padding-top:4px;font-size:13px;color:#aaaaaa;">
                  Este link e pessoal e expira em 7 dias.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer cinza claro -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="font-size:12px;color:#aaaaaa;line-height:1.5;">
                  <a href="${appUrl}" style="color:#FF4D6D;text-decoration:none;font-weight:bold;">Pikbio</a>
                  &nbsp;&middot;&nbsp;
                  <a href="${appUrl}/contato" style="color:#aaaaaa;text-decoration:underline;">Central de ajuda</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:8px;font-size:11px;color:#cccccc;">
                  Se voce nao fez esta compra, ignore este email.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:4px;font-size:11px;color:#cccccc;">
                  Pedido: ${orderId}
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}

export function accessEmailText(data: AccessEmailData): string {
  return [
    `Ola, ${data.buyerName}!`,
    "",
    "Seu pagamento foi confirmado. Acesse seu produto pelo link abaixo:",
    "",
    data.accessUrl,
    "",
    `Produto: ${data.productTitle}`,
    "Este link e pessoal e expira em 7 dias.",
    `Pedido: ${data.orderId}`,
    "",
    "Se voce nao fez esta compra, ignore este email.",
  ].join("\n");
}

type PhysicalEmailData = {
  buyerName: string;
  productTitle: string;
  statusUrl: string;
};

export function physicalOrderHtml(data: PhysicalEmailData): string {
  const name = safe(data.buyerName);
  const title = safe(data.productTitle);
  const url = safe(data.statusUrl);
  const appUrl = safe(process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio");

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

        <tr>
          <td align="center" style="background:#0a0a0a;padding:24px 24px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <img src="${appUrl}/logo-pikbio.png" alt="" width="32" height="32" style="display:block;border:0;width:32px;height:32px;" />
                </td>
                <td valign="middle" style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Pikbio<span style="color:#FF4D6D;">.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background:#FF4D6D;padding:32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-size:40px;line-height:1;">&#128230;</td>
              </tr>
              <tr>
                <td align="center" style="padding-top:12px;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Pedido Confirmado
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size:16px;color:#333333;line-height:1.6;">
                  Ola, <strong>${name}</strong>!
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:15px;color:#555555;line-height:1.6;">
                  Seu pagamento foi confirmado e o vendedor ja pode preparar o envio.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:24px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background:#FF4D6D;border-radius:6px;">
                        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">Acompanhar meu pedido</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;font-size:14px;color:#888888;line-height:1.5;">
                  <strong style="color:#333333;">Produto:</strong> ${title}
                </td>
              </tr>
              <tr>
                <td style="padding-top:4px;font-size:13px;color:#aaaaaa;">
                  Use este link para acompanhar o status e o codigo de rastreio.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="font-size:12px;color:#aaaaaa;line-height:1.5;">
                  <a href="${appUrl}" style="color:#FF4D6D;text-decoration:none;font-weight:bold;">Pikbio</a>
                  &nbsp;&middot;&nbsp;
                  <a href="${appUrl}/contato" style="color:#aaaaaa;text-decoration:underline;">Central de ajuda</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:8px;font-size:11px;color:#cccccc;">
                  Se voce nao fez esta compra, ignore este email.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}

export function physicalOrderText(data: PhysicalEmailData): string {
  return [
    `Ola, ${data.buyerName}!`,
    "",
    "Seu pagamento foi confirmado e o vendedor ja pode preparar o envio.",
    "",
    `Acompanhe seu pedido: ${data.statusUrl}`,
    "",
    `Produto: ${data.productTitle}`,
    "Use este link para acompanhar o status e o codigo de rastreio.",
    "",
    "Se voce nao fez esta compra, ignore este email.",
  ].join("\n");
}

type NotificationEmailData = {
  to: string;
  subject: string;
  body: string;
};

export function notificationHtml(data: NotificationEmailData): string {
  const safeBody = safe(data.body);
  const appUrl = safe(process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio");

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

        <tr>
          <td align="center" style="background:#0a0a0a;padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:8px;">
                  <img src="${appUrl}/logo-pikbio.png" alt="" width="28" height="28" style="display:block;border:0;width:28px;height:28px;" />
                </td>
                <td valign="middle" style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Pikbio<span style="color:#FF4D6D;">.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 24px;font-size:15px;color:#555555;line-height:1.6;">
            ${safeBody.replace(/\n/g, "<br/>")}
          </td>
        </tr>

        <tr>
          <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 24px;font-size:11px;color:#aaaaaa;text-align:center;">
            Voce recebeu este email porque tem notificacoes ativas no Pikbio.<br/>
            <a href="${appUrl}/dashboard/configuracoes" style="color:#FF4D6D;text-decoration:underline;">Gerenciar notificacoes</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}

export function notificationText(data: NotificationEmailData): string {
  return [
    data.body,
    "",
    `---`,
    `Voce recebeu este email porque tem notificacoes ativas no Pikbio.`,
    `Gerencie: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio"}/dashboard/configuracoes`,
  ].join("\n");
}

type WelcomeEmailData = {
  name: string;
  username: string;
};

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const name = safe(data.name);
  const username = safe(data.username);
  const appUrl = safe(process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio");
  const storeUrl = `${appUrl}/${username}`;

  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

        <tr>
          <td align="center" style="background:#0a0a0a;padding:24px 24px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <img src="${appUrl}/logo-pikbio.png" alt="" width="32" height="32" style="display:block;border:0;width:32px;height:32px;" />
                </td>
                <td valign="middle" style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  Pikbio<span style="color:#FF4D6D;">.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background:#0a0a0a;padding:0 24px 32px;">
            <span style="font-size:40px;line-height:1;">&#127881;</span>
            <p style="margin:12px 0 0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              Bem-vindo ao Pikbio
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size:16px;color:#333333;line-height:1.6;">
                  Ola, <strong>${name}</strong>!
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:15px;color:#555555;line-height:1.6;">
                  Sua loja foi criada com sucesso. Agora voce pode cadastrar produtos, personalizar o tema e comecar a vender.
                </td>
              </tr>
              <tr>
                <td style="padding-top:8px;font-size:15px;color:#555555;line-height:1.6;">
                  Sua pagina publica: <a href="${storeUrl}" style="color:#FF4D6D;font-weight:bold;text-decoration:none;">${storeUrl}</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:24px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background:#FF4D6D;border-radius:6px;">
                        <a href="${appUrl}/dashboard" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">Ir para o dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size:14px;font-weight:bold;color:#333333;padding-bottom:12px;">
                  Primeiros passos:
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555555;line-height:2;">
                  &#10003; Conecte um gateway de pagamento (Mercado Pago ou Efi Bank)<br/>
                  &#10003; Crie seu primeiro produto digital<br/>
                  &#10003; Personalize o tema da sua loja<br/>
                  &#10003; Compartilhe seu link na bio
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 24px;text-align:center;font-size:12px;color:#aaaaaa;line-height:1.5;">
            <a href="${appUrl}" style="color:#FF4D6D;text-decoration:none;font-weight:bold;">Pikbio</a>
            &nbsp;&middot;&nbsp;
            <a href="${appUrl}/contato" style="color:#aaaaaa;text-decoration:underline;">Central de ajuda</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio";
  const storeUrl = `${appUrl}/${data.username}`;
  return [
    `Ola, ${data.name}!`,
    "",
    "Sua loja foi criada com sucesso. Agora voce pode cadastrar produtos, personalizar o tema e comecar a vender.",
    "",
    `Sua pagina publica: ${storeUrl}`,
    "",
    "Acesse o dashboard: ${appUrl}/dashboard",
    "",
    "Primeiros passos:",
    "- Conecte um gateway de pagamento (Mercado Pago ou Efi Bank)",
    "- Crie seu primeiro produto digital",
    "- Personalize o tema da sua loja",
    "- Compartilhe seu link na bio",
    "",
    "Se tiver duvidas, acesse nossa central de ajuda: ${appUrl}/contato",
  ].join("\n");
}
