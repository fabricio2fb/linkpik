import { err, ok } from "@/lib/api/response";
import { sendSummaries } from "@/lib/api/summary-cron";

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
    const result = await sendSummaries(7, "notify_weekly_summary");
    return ok(result);
  } catch (e) {
    return err(e);
  }
}
