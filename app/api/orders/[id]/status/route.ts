import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("default", ip);

    const { id } = await context.params;
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    if (!email) throw new ApiError(400, "Email obrigatorio");

    const supabase = createSupabaseService();
    const { data: order } = await supabase
      .from("orders")
      .select("status, gateway, checkout_url")
      .eq("id", id)
      .eq("buyer_email", email)
      .single();

    if (!order) throw new ApiError(404, "Pedido nao encontrado");
    return ok({
      status: order.status,
      gateway: order.gateway ?? "mercadopago",
      checkout_url: order.status === "pending" ? order.checkout_url : null,
      access_granted: order.status === "paid",
    });
  } catch (e) {
    return err(e);
  }
}
