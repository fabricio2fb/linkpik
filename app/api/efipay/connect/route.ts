import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { saveEfipayAccount, validateEfipayCredentials } from "@/lib/api/efipay";
import { ensureDefaultPaymentGateway } from "@/lib/api/payment-gateway";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const ConnectEfipaySchema = z.object({
  clientId: z.string().min(20).max(100).trim(),
  clientSecret: z.string().min(20).max(200).trim(),
  pixKey: z.string().min(5).max(200).trim().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("efipay-connect", ip);

    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const body = await request.json();
    const parsed = ConnectEfipaySchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Credenciais invalidas");

    const { valid, accountInfo } = await validateEfipayCredentials(parsed.data.clientId, parsed.data.clientSecret);
    if (!valid) throw new ApiError(400, "Credenciais invalidas");

    await saveEfipayAccount({
      creatorId: creator.id,
      clientId: parsed.data.clientId,
      clientSecret: parsed.data.clientSecret,
      pixKey: parsed.data.pixKey,
      accountInfo,
    });
    await ensureDefaultPaymentGateway(creator.id, "efipay");

    return ok({ success: true });
  } catch (e) {
    return err(e);
  }
}
