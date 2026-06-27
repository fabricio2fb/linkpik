import { hashAccessToken } from "@/lib/api/access-token";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { sanitizeUrl } from "@/lib/api/sanitize-url";
import { createSupabaseService } from "@/lib/api/supabase-service";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function applyMessageTokens(message: string, params: { buyerName: string; productTitle: string; deliveryLink?: string | null }) {
  return message
    .replaceAll("{nome}", params.buyerName)
    .replaceAll("{produto}", params.productTitle)
    .replaceAll("{link}", params.deliveryLink ?? "")
    .replaceAll("{email}", "")
    .replaceAll("{data}", new Date().toLocaleDateString("pt-BR"));
}

function getExternalDeliveryLink(details: Record<string, unknown>) {
  for (const key of ["deliveryUrl", "accessLink", "courseUrl"]) {
    const value = stringField(details, key);
    if (!value) continue;
    const safeUrl = sanitizeUrl(value);
    if (safeUrl) return safeUrl;
  }
  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const tokenHash = hashAccessToken(token);
    const supabase = createSupabaseService();

    const { data: accessToken } = await supabase
      .from("access_tokens")
      .select("id, order_id, used_at, expires_at")
      .eq("token_hash", tokenHash)
      .single();

    if (!accessToken) throw new ApiError(404, "Link invalido ou expirado");
    if (new Date(accessToken.expires_at) < new Date()) throw new ApiError(410, "Este link expirou");

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, product_id, buyer_name, buyer_email")
      .eq("id", accessToken.order_id)
      .single();

    if (!order || order.status !== "paid") throw new ApiError(403, "Pagamento nao confirmado");

    const { data: product } = await supabase
      .from("products")
      .select("id, title, file_url, cover_url, type, details")
      .eq("id", order.product_id)
      .single();

    if (!product) throw new ApiError(404, "Arquivo nao encontrado");

    const details = asRecord(product.details);
    const externalLink = getExternalDeliveryLink(details);
    let downloadUrl: string | null = null;

    if (product.file_url) {
      const { data: signed, error } = await supabase.storage.from("product-files").createSignedUrl(product.file_url, 1800);
      if (error) throw new ApiError(500, "Erro ao gerar acesso");
      downloadUrl = signed.signedUrl;
    }

    const rawDeliveryMessage = stringField(details, "deliveryMessage");
    const deliveryLink = downloadUrl ?? externalLink;
    const deliveryMessage = rawDeliveryMessage
      ? applyMessageTokens(rawDeliveryMessage, {
          buyerName: order.buyer_name,
          productTitle: product.title,
          deliveryLink,
        })
      : null;
    const rawThankYou = stringField(details, "thankYouMessage");
    const thankYouUrl = rawThankYou ? sanitizeUrl(rawThankYou) : "";
    const thankYouMessage = rawThankYou && !thankYouUrl ? rawThankYou : null;

    if (!downloadUrl && !externalLink && !deliveryMessage && !thankYouUrl && !thankYouMessage) {
      console.warn("[AccessDeliveryMissing]", { order_id: order.id, product_id: product.id });
      throw new ApiError(404, "Arquivo nao encontrado");
    }

    await supabase.from("access_tokens").update({ used_at: new Date().toISOString() }).eq("id", accessToken.id);
    await supabase.from("audit_log").insert({
      action: "product_accessed",
      resource: "orders",
      resource_id: order.id,
      metadata: { via: "access_token", product_id: product.id },
    });

    return ok({
      product: {
        title: product.title,
        type: product.type,
        cover_url: product.cover_url,
      },
      download_url: downloadUrl,
      delivery_url: externalLink,
      delivery_message: deliveryMessage,
      thank_you_message: thankYouMessage,
      thank_you_url: thankYouUrl || null,
      buyer_name: order.buyer_name,
    });
  } catch (e) {
    return err(e);
  }
}
