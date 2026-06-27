import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { chooseDefaultPaymentGateway } from "@/lib/api/payment-gateway";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const UpdatePaymentGatewaySchema = z.object({
  gateway: z.enum(["mercadopago", "efipay"]),
}).strict();

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = UpdatePaymentGatewaySchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Gateway invalido");

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const defaultPaymentGateway = await chooseDefaultPaymentGateway(creator.id, parsed.data.gateway);

    return ok({ default_payment_gateway: defaultPaymentGateway });
  } catch (e) {
    return err(e);
  }
}
