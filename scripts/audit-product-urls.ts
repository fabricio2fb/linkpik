import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { sanitizeUrl } from "../lib/api/sanitize-url";

const URL_FIELDS = ["cover_url"] as const;
const DETAILS_URL_FIELDS = ["deliveryUrl", "accessLink", "courseUrl"] as const;
const PAGE_SIZE = 1000;

type ProductRow = {
  id: string;
  creator_id: string;
  cover_url: string | null;
  details: Record<string, unknown> | null;
};

type Finding = {
  product_id: string;
  creator_id: string;
  field: string;
  value: string;
};

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function auditUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return sanitizeUrl(trimmed) ? null : trimmed;
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para executar a auditoria.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const findings: Finding[] = [];
  const warnings: string[] = [];
  let from = 0;
  let detailsColumnAvailable = true;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const query = supabase
      .from("products")
      .select(detailsColumnAvailable ? "id, creator_id, cover_url, details" : "id, creator_id, cover_url")
      .range(from, to);

    let result = await query;
    let data = result.data as unknown;
    let error = result.error;

    if (error && error.code === "42703" && detailsColumnAvailable) {
      detailsColumnAvailable = false;
      warnings.push("A coluna products.details nao existe neste banco; campos details.deliveryUrl/details.accessLink/details.courseUrl nao foram auditados.");
      const fallback = await supabase
        .from("products")
        .select("id, creator_id, cover_url")
        .range(from, to);
      data = fallback.data as unknown;
      error = fallback.error;
    }

    if (error) throw error;

    const products = (data ?? []) as ProductRow[];
    for (const product of products) {
      for (const field of URL_FIELDS) {
        const invalidValue = auditUrl(product[field]);
        if (invalidValue) {
          findings.push({
            product_id: product.id,
            creator_id: product.creator_id,
            field,
            value: invalidValue,
          });
        }
      }

      const details = product.details && typeof product.details === "object" && !Array.isArray(product.details)
        ? product.details
        : {};
      for (const field of DETAILS_URL_FIELDS) {
        const invalidValue = auditUrl(details[field]);
        if (invalidValue) {
          findings.push({
            product_id: product.id,
            creator_id: product.creator_id,
            field: `details.${field}`,
            value: invalidValue,
          });
        }
      }
    }

    if (products.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const report = {
    checked_at: new Date().toISOString(),
    warnings,
    findings_count: findings.length,
    findings,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
