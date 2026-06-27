import { getDashboardPaymentStatus } from "@/lib/api/dashboard-overview";
import { getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("dashboard", creator.userId);
    return ok(await getDashboardPaymentStatus());
  } catch (e) {
    return err(e);
  }
}
