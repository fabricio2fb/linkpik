import { z } from "zod";
import { createHash } from "crypto";
import { generateAccessToken } from "@/lib/api/access-token";
import { ApiError } from "@/lib/api/errors";
import { sendAccessEmail } from "@/lib/api/mailer";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";

const RenewSchema = z.object({
  order_id: z.string().uuid(),
  buyer_email: z.string().email(),
}).strict();

const genericMessage = "Se este pedido existir, um novo link sera enviado.";

function hashIp(ip: string) {
  return createHash("sha256").update(ip + process.env.ANALYTICS_SALT).digest("hex");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("renew", ip);

    const body = await request.json();
    const parsed = RenewSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const supabase = createSupabaseService();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, product_id, buyer_email, buyer_name")
      .eq("id", parsed.data.order_id)
      .eq("buyer_email", parsed.data.buyer_email)
      .single();

    if (!order || order.status !== "paid") return ok({ message: genericMessage });

    const { data: product } = await supabase.from("products").select("title").eq("id", order.product_id).single();
    await supabase.from("access_tokens").delete().eq("order_id", order.id);

    const { token, hash } = generateAccessToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await supabase.from("access_tokens").insert({
      token_hash: hash,
      order_id: order.id,
      expires_at: expiresAt.toISOString(),
    });

    await sendAccessEmail({
      buyerEmail: order.buyer_email,
      buyerName: order.buyer_name,
      productTitle: product?.title ?? "seu produto",
      accessToken: token,
      orderId: order.id,
    });

    await supabase.from("audit_log").insert({
      action: "access_token_renewed",
      resource: "orders",
      resource_id: order.id,
      metadata: { ip_hash: hashIp(ip) },
    });

    return ok({ message: genericMessage });
  } catch (e) {
    return err(e);
  }
}
