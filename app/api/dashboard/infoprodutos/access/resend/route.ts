import { z } from "zod";
import { generateAccessToken } from "@/lib/api/access-token";
import { ApiError } from "@/lib/api/errors";
import { dispatchCreatorWebhook } from "@/lib/api/creator-webhooks";
import { sendAccessEmail } from "@/lib/api/mailer";
import { auditLog, getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { isDigitalProduct } from "@/lib/api/dashboard-utils";

const ResendAccessSchema = z
  .object({
    order_id: z.string().uuid(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("mutations", ip);

    const creator = await getCreatorContext();
    const body = await request.json();
    const parsed = ResendAccessSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      throw new ApiError(503, "Envio de email nao configurado neste ambiente");
    }

    const supabase = createSupabaseService();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, creator_id, buyer_email, buyer_name, status, products(id, title, type, product_kind)")
      .eq("id", parsed.data.order_id)
      .eq("creator_id", creator.creatorId)
      .single();

    if (error || !order) throw new ApiError(404, "Pedido nao encontrado");
    if (order.status !== "paid") throw new ApiError(409, "O acesso so pode ser reenviado para pedidos pagos");

    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    if (!isDigitalProduct(product)) throw new ApiError(400, "Pedido nao e de infoproduto");
    if (!order.buyer_email) throw new ApiError(409, "Pedido sem email do comprador");

    await supabase.from("access_tokens").delete().eq("order_id", order.id);

    const access = generateAccessToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from("access_tokens").insert({
      order_id: order.id,
      token_hash: access.hash,
      expires_at: expiresAt,
    });
    if (insertError) throw new ApiError(500, "Erro ao gerar novo acesso");

    await sendAccessEmail({
      buyerEmail: order.buyer_email,
      buyerName: order.buyer_name ?? "Cliente",
      productTitle: product?.title ?? "Produto",
      accessToken: access.token,
      orderId: order.id,
    });

    await dispatchCreatorWebhook({
      creatorId: creator.creatorId,
      event: "access.granted",
      payload: {
        order_id: order.id,
        product: product?.title ?? "Produto",
        buyer_email: order.buyer_email,
        access_expires_at: expiresAt,
      },
    });

    await auditLog({
      creatorId: creator.creatorId,
      actorId: creator.userId,
      action: "access_resend",
      entityType: "order",
      entityId: order.id,
      metadata: { product_id: product?.id ?? null },
    });

    return ok({ sent: true });
  } catch (e) {
    return err(e);
  }
}
