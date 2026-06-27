import { getPublicWebPushKey } from "@/lib/api/web-push";
import { err, ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const publicKey = getPublicWebPushKey();
    if (!publicKey) throw new ApiError(503, "Push nao configurado");
    return ok({ public_key: publicKey });
  } catch (e) {
    return err(e);
  }
}
