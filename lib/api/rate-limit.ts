import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ApiError } from "./errors";

type LimiterName = "auth" | "orders" | "orders_read" | "analytics" | "renew" | "dashboard" | "shipping" | "public_status" | "mutations" | "default" | "efipay-connect" | "efipay-disconnect" | "efipay-webhook";

let cachedRateLimiters: Record<LimiterName, Ratelimit> | null = null;

function getRateLimiters() {
  if (cachedRateLimiters) return cachedRateLimiters;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new ApiError(500, "Rate limit nao configurado");
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  cachedRateLimiters = {
    auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m") }),
    orders: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m") }),
    orders_read: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m") }),
    analytics: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m") }),
    renew: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "10 m") }),
    dashboard: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "1 m") }),
    shipping: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m") }),
    public_status: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m") }),
    mutations: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m") }),
    default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m") }),
    "efipay-connect": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h") }),
    "efipay-disconnect": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h") }),
    "efipay-webhook": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(500, "1 m") }),
  };

  return cachedRateLimiters;
}

export async function applyRateLimit(limiter: LimiterName, identifier: string) {
  const { success } = await getRateLimiters()[limiter].limit(identifier);
  if (!success) throw new ApiError(429, "Muitas requisicoes. Aguarde.");
}
