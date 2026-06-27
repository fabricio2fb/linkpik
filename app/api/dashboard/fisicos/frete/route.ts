import { getShippingSettings } from "@/lib/api/shipping-settings";
import { getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("dashboard", creator.userId);
    return ok(await getShippingSettings());
  } catch (e) {
    return err(e);
  }
}
