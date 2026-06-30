import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FEATURE_CUSTOM_DOMAIN, FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";

const PUBLIC_ROUTES = ["/", "/login", "/registro", "/lojaexemplo", "/recuperar-senha"];
const PUBLIC_API_PREFIXES = ["/api/public", "/api/webhooks", "/api/analytics/track", "/api/access"];
const PUBLIC_API_EXACT = ["/api/auth/session", "/api/auth/register", "/api/auth/rate-check", "/api/auth/callback", "/api/orders", "/api/docs"];
const RESERVED_PUBLIC_SLUGS = new Set([
  "api",
  "dashboard",
  "login",
  "registro",
  "criar",
  "lojaexemplo",
  "_next",
]);
const PHYSICAL_PRODUCT_PAGE_PREFIXES = [
  "/dashboard/fisicos",
  "/dashboard/entregas",
  "/pedido/status",
];
const PHYSICAL_PRODUCT_PAGE_EXACT = [
  "/dashboard/produtos/fisicos",
  "/dashboard/produtos/estoque",
  "/dashboard/vendas/fisicos",
  "/demo/produto-fisico",
  "/demo/rastreio",
];
const PHYSICAL_PRODUCT_API_PREFIXES = [
  "/api/dashboard/fisicos",
  "/api/public/order-status",
];
const PHYSICAL_PRODUCT_API_EXACT = [
  "/api/shipping/quote",
];

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = withSecurityHeaders(NextResponse.next());

  const host = request.headers.get("host") ?? "";
  const mainHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host;
  const isCustomDomain = FEATURE_CUSTOM_DOMAIN && host && host !== mainHost && !host.includes("localhost");

  if (isCustomDomain) {
    const serviceRole = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: settings } = await serviceRole
      .from("creator_settings")
      .select("creator_id, custom_domain, domain_verified")
      .eq("custom_domain", host)
      .maybeSingle();

    if (settings?.domain_verified && settings.creator_id) {
      const { data: creator } = await serviceRole
        .from("creators")
        .select("username")
        .eq("id", settings.creator_id)
        .single();
      if (creator?.username) {
        return withSecurityHeaders(NextResponse.rewrite(new URL(`/${creator.username}${pathname}`, request.url)));
      }
    }
  }

  const isPhysicalProductPage =
    PHYSICAL_PRODUCT_PAGE_EXACT.includes(pathname) ||
    PHYSICAL_PRODUCT_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    (pathname === "/dashboard/produtos/novo" && ["fisico", "physical"].includes(request.nextUrl.searchParams.get("tipo") ?? ""));
  const isPhysicalProductApi =
    PHYSICAL_PRODUCT_API_EXACT.includes(pathname) ||
    PHYSICAL_PRODUCT_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!FEATURE_PHYSICAL_PRODUCT && isPhysicalProductApi) {
    return withSecurityHeaders(NextResponse.json({ error: "Recurso nao encontrado" }, { status: 404 }));
  }

  if (!FEATURE_PHYSICAL_PRODUCT && isPhysicalProductPage) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (pathname.startsWith("/api")) {
    const origin = request.headers.get("origin") ?? "";
    const allowed = [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"].filter(Boolean);
    if (origin && !allowed.includes(origin)) {
      return withSecurityHeaders(new NextResponse(null, { status: 403 }));
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  const isPublicApi =
    PUBLIC_API_EXACT.some((route) => pathname === route) ||
    PUBLIC_API_PREFIXES.some((route) => pathname.startsWith(route)) ||
    /^\/api\/orders\/[^/]+\/status$/.test(pathname) ||
    (pathname.startsWith("/api/creators/") && pathname !== "/api/creators/me");
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const isUsername = /^\/[a-z0-9._-]+(\/[^/]+)?$/.test(pathname) && !RESERVED_PUBLIC_SLUGS.has(firstSegment);

  if (isPublicRoute || isPublicApi || isUsername) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    }
    if (pathname.startsWith("/api")) {
      return withSecurityHeaders(NextResponse.json({ error: "Nao autenticado" }, { status: 401 }));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
