import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { signWebhookBody } from "@/lib/api/web-push";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { WEBHOOK_EVENTS } from "@/lib/constants/webhook-events";

const TestSchema = z.object({
  webhook_url: z.string().url().max(300),
  webhook_secret: z.string().max(120).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = TestSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "URL invalida");

    const { webhook_url, webhook_secret } = parsed.data;

    const payload = {
      event: WEBHOOK_EVENTS.WEBHOOK_TEST,
      created_at: new Date().toISOString(),
      data: {
        message: "Este e um webhook de teste do Pikbio.",
        timestamp: new Date().toISOString(),
      },
    };

    const rawBody = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Pikbio-Webhooks/1.0",
    };
    if (webhook_secret) {
      headers["X-Pikbio-Signature"] = `sha256=${signWebhookBody(rawBody, webhook_secret)}`;
    }

    const start = performance.now();
    let responseStatus = 0;
    let responseBody = "";
    let errorMessage: string | null = null;

    try {
      const res = await fetch(webhook_url, {
        method: "POST",
        headers,
        body: rawBody,
        signal: AbortSignal.timeout(5000),
      });
      responseStatus = res.status;
      responseBody = (await res.text().catch(() => "")).slice(0, 2000);
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") {
        errorMessage = "Timeout - o servidor nao respondeu em 5 segundos";
      } else {
        errorMessage = e instanceof Error ? e.message : "Erro desconhecido ao enviar webhook";
      }
    }

    const elapsed = Math.round(performance.now() - start);
    const success = errorMessage === null && responseStatus >= 200 && responseStatus < 300;

    const supabase = createSupabaseService();
    try {
      await supabase.from("webhook_logs").insert({
        creator_id: user.id,
        event_type: WEBHOOK_EVENTS.WEBHOOK_TEST,
        webhook_url,
        request_payload: payload,
        response_status: errorMessage ? null : responseStatus,
        response_body: errorMessage ? null : responseBody || null,
        response_time_ms: elapsed,
        success,
        error_message: errorMessage,
        is_test: true,
      });
    } catch {
      // fire-and-forget
    }

    return ok({
      success,
      statusCode: errorMessage ? null : responseStatus,
      responseTimeMs: elapsed,
      responseBody: errorMessage ? null : responseBody || null,
      error: errorMessage,
    });
  } catch (e) {
    return err(e);
  }
}
