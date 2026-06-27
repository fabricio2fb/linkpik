import { z } from "zod";
import { getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { createSupabaseService } from "@/lib/api/supabase-service";

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(20).max(500),
    auth: z.string().min(10).max(200),
  }).strict(),
}).strict();

export async function POST(request: Request) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("mutations", creator.userId);
    const parsed = PushSubscriptionSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Assinatura push invalida");

    const endpointUrl = new URL(parsed.data.endpoint);
    if (endpointUrl.protocol !== "https:") throw new ApiError(400, "Endpoint push invalido");

    const supabase = createSupabaseService();
    const { error } = await supabase.from("web_push_subscriptions").upsert({
      creator_id: creator.creatorId,
      user_id: creator.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    }, { onConflict: "endpoint" });
    if (error) throw new ApiError(500, "Erro ao salvar push");
    return ok({ subscribed: true });
  } catch (e) {
    return err(e);
  }
}

export async function DELETE() {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("mutations", creator.userId);
    const supabase = createSupabaseService();
    await supabase.from("web_push_subscriptions").delete().eq("creator_id", creator.creatorId).eq("user_id", creator.userId);
    return ok({ subscribed: false });
  } catch (e) {
    return err(e);
  }
}
