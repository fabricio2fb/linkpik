import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError } from "@/lib/api/errors";
import { registerEfipayPixWebhookWithCredentials } from "@/lib/api/efipay";
import { err, ok } from "@/lib/api/response";

const RegisterEfipayWebhookSchema = z.object({
  pixKey: z.string().trim().min(5).max(200).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) throw new ApiError(404, "Admin nao encontrado");

    const body = await request.json().catch(() => ({}));
    const parsed = RegisterEfipayWebhookSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const clientId = process.env.EFIPAY_PIKBIO_CLIENT_ID;
    const clientSecret = process.env.EFIPAY_PIKBIO_CLIENT_SECRET;
    const pixKey = parsed.data.pixKey ?? process.env.EFIPAY_PIKBIO_PIX_KEY;

    if (!clientId || !clientSecret || !pixKey) {
      throw new ApiError(500, "Credenciais/chave PIX principal da Efipay nao configuradas");
    }

    await registerEfipayPixWebhookWithCredentials({
      clientId,
      clientSecret,
      pixKey,
    });

    await logAdminAction({
      action: "registrou_webhook_efipay",
      adminEmail: adminUser.email,
      metadata: {
        pix_key_suffix: pixKey.slice(-6),
      },
    });

    return ok({
      registered: true,
      pix_key_suffix: pixKey.slice(-6),
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/webhooks/efipay?hmac=***`,
    });
  } catch (e) {
    return err(e);
  }
}
