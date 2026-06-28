import { err } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";

export async function POST() {
  return err(new ApiError(410, "Endpoint deprecated. Use /api/subscriptions/mercadopago/create."));
}
