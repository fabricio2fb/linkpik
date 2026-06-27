import { getPhysicalDeliveries } from "@/lib/api/physical-deliveries";
import { getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("dashboard", creator.userId);
    return ok(await getPhysicalDeliveries());
  } catch (e) {
    return err(e);
  }
}
