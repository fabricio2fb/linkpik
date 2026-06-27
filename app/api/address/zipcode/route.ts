import { z } from "zod";
import { lookupCep } from "@/lib/api/cep";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";

const ZipcodeQuerySchema = z.object({
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP invalido"),
}).strict();

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await applyRateLimit("shipping", ip);

    const { searchParams } = new URL(request.url);
    const parsed = ZipcodeQuerySchema.safeParse({ cep: searchParams.get("cep") ?? "" });
    if (!parsed.success) throw new ApiError(400, "CEP invalido");

    const address = await lookupCep(parsed.data.cep);
    return ok(address);
  } catch (e) {
    return err(e);
  }
}
