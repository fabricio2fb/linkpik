import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";

const CheckoutStatusSchema = z.object({
  order: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("default", ip);

    const url = new URL(request.url);
    const parsed = CheckoutStatusSchema.safeParse({ order: url.searchParams.get("order") });
    if (!parsed.success) throw new ApiError(400, "Pedido invalido");

    const supabase = createSupabaseService();
    const { data: order } = await supabase
      .from("orders")
      .select(`
        id, status, gateway, gateway_status, checkout_url, payment_method_preference,
        pix_qr_code, pix_copia_cola, boleto_url, boleto_barcode,
        amount, currency, paid_at, created_at
      `)
      .eq("id", parsed.data.order)
      .maybeSingle();

    if (!order) throw new ApiError(404, "Pedido nao encontrado");
    return ok({ ...order });
  } catch (e) {
    return err(e);
  }
}
