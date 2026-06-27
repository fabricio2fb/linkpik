import type { MetadataRoute } from "next";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/dashboard/",
        "/checkout/",
        "/acesso/",
        "/pedido/status/",
        "/login",
        "/registro",
        "/criar",
        "/privacidade/solicitar",
        "/lojaexemplo",
        "/landingpage2",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
