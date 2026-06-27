import { createHash } from "crypto";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { TrackEventSchema } from "@/lib/schemas/analytics.schema";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + process.env.ANALYTICS_SALT).digest("hex");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await applyRateLimit("analytics", ip);

    const body = await request.json();
    const parsed = TrackEventSchema.safeParse(body);
    if (!parsed.success) return new Response(null, { status: 204 });

    const supabaseService = createSupabaseService();
    await supabaseService.from("analytics_events").insert({
      ...parsed.data,
      ip_hash: hashIp(ip),
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
