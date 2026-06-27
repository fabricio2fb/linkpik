import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { exchangeOAuthCode, saveConnectedAccount, verifyOAuthState } from "@/lib/api/mercadopago";
import { ensureDefaultPaymentGateway } from "@/lib/api/payment-gateway";
import { err } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) throw new ApiError(400, "Callback Mercado Pago invalido");

    const user = await getAuthUser();
    if (!verifyOAuthState(state, user.id)) throw new ApiError(400, "State Mercado Pago invalido");

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const token = await exchangeOAuthCode(code);
    await saveConnectedAccount({ creatorId: creator.id, token });
    await ensureDefaultPaymentGateway(creator.id, "mercadopago");

    return NextResponse.redirect(new URL("/dashboard/configuracoes?tab=pagamentos&mp=connected", request.url));
  } catch (e) {
    console.error("[MercadoPago OAuth Callback Error]", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : null,
      error: e,
    });
    if (e instanceof ApiError) {
      return NextResponse.redirect(new URL(`/dashboard/configuracoes?tab=pagamentos&mp=error&message=${encodeURIComponent(e.message)}`, request.url));
    }
    return err(e);
  }
}
