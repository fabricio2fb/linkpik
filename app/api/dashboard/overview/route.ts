import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { getDashboardOverview } from "@/lib/api/dashboard-overview";
import { getCreatorContext } from "@/lib/api/physical-orders";
import { PaginationQuerySchema } from "@/lib/api/dashboard-utils";
import { ApiError } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("dashboard", creator.userId);
    const parsed = PaginationQuerySchema.pick({ period: true }).safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) throw new ApiError(400, "Filtros invalidos");
    return ok(await getDashboardOverview(parsed.data));
  } catch (e) {
    return err(e);
  }
}
