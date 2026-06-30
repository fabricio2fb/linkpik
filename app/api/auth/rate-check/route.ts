import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ALLOWED_ACTIONS = ["password-reset", "password-reset-verify"] as const;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  let body: { action?: string; identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (!body.action || !ALLOWED_ACTIONS.includes(body.action as typeof ALLOWED_ACTIONS[number])) {
    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
  }

  if (body.action === "password-reset") {
    const rateKey = `rate:password-reset:${ip}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 900);
    if (count > 3) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });
    }
    return NextResponse.json({ allowed: true, remaining: 3 - count });
  }

  if (body.action === "password-reset-verify") {
    const identifier = body.identifier ?? ip;
    const rateKey = `rate:password-reset-verify:${identifier}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 900);
    if (count > 5) {
      return NextResponse.json({ error: "Muitas tentativas. Solicite um novo código." }, { status: 429 });
    }
    return NextResponse.json({ allowed: true, remaining: 5 - count });
  }

  return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
}
