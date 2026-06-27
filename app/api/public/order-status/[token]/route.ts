import { applyRateLimit } from "@/lib/api/rate-limit";
import { getPublicOrderStatus } from "@/lib/api/physical-orders";
import { err } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { PublicTokenSchema } from "@/lib/schemas/physical.schema";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await applyRateLimit("public_status", ip);

    const { token } = await context.params;
    const parsed = PublicTokenSchema.safeParse(token);
    if (!parsed.success) throw new ApiError(404, "Pedido nao encontrado");

    const status = await getPublicOrderStatus(parsed.data);
    return NextResponse.json({ data: status }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return err(e);
  }
}
