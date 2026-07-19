export const SITE_CONFIG = {
  name: "Pikbio",
  slug: "pikbio",
  domain: "pik.bio",
} as const;

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? `https://${SITE_CONFIG.domain}`).replace(/\/$/, "");
}
