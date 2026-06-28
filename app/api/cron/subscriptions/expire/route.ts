import { expirePendingCancellationSubscriptions } from "@/lib/api/mercadopago";
import { err, ok } from "@/lib/api/response";

function isAuthorized(request: Request) {
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron") ?? false;
  if (isVercelCron) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await expirePendingCancellationSubscriptions();
    return ok(result);
  } catch (e) {
    return err(e);
  }
}
