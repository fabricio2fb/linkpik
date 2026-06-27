import { revalidateTag } from "next/cache";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getPlanLimits, type Plan } from "@/lib/api/plans";
import { parseAndValidateProductPageSections } from "@/lib/api/product-page-sections";
import { sanitizeProductUrlFields } from "@/lib/api/product-sanitize";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { CreateProductSchema } from "@/lib/schemas/product.schema";

async function getCreatorForUser(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, username, plan").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const { supabase, creator } = await getCreatorForUser(user.id);
    const { data, error } = await supabase.from("products").select("*").eq("creator_id", creator.id).order("position");
    if (error) throw new ApiError(500, "Erro ao listar produtos");
    const products = (data ?? []).filter((product) => FEATURE_PHYSICAL_PRODUCT || (product.type !== "fisico" && product.product_kind !== "physical"));
    return ok(products);
  } catch (e) {
    return err(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await applyRateLimit("mutations", user.id);
    }
    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      throw new ApiError(400, field ? `Dados invalidos: ${field}` : "Dados invalidos");
    }

    const sanitizedProduct = sanitizeProductUrlFields(parsed.data);
    if (sanitizedProduct.page_sections) {
      sanitizedProduct.page_sections = parseAndValidateProductPageSections(sanitizedProduct.page_sections, {
        price: sanitizedProduct.price,
        billingType: sanitizedProduct.details?.billingType,
      });
    }
    if (!FEATURE_PHYSICAL_PRODUCT && (sanitizedProduct.type === "fisico" || sanitizedProduct.product_kind === "physical")) {
      throw new ApiError(404, "Recurso nao encontrado");
    }
    const { supabase, creator } = await getCreatorForUser(user.id);
    const limits = getPlanLimits(creator.plan as Plan);

    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("creator_id", creator.id);
    if ((count ?? 0) >= limits.max_products) {
      throw new ApiError(403, `Plano ${creator.plan} permite ate ${limits.max_products} produtos. Faca upgrade para adicionar mais.`);
    }

    if (sanitizedProduct.upsell_id) {
      if (!limits.upsell) throw new ApiError(403, "Upsell disponivel apenas no plano Pro.");
      const { data: upsell } = await supabase
        .from("products")
        .select("id")
        .eq("id", sanitizedProduct.upsell_id)
        .eq("creator_id", creator.id)
        .single();
      if (!upsell) throw new ApiError(400, "Produto de upsell invalido");
    }

    const insertData = {
      ...sanitizedProduct,
      product_kind: sanitizedProduct.type === "fisico" ? "physical" : "digital",
      is_active: sanitizedProduct.status === "active",
      creator_id: creator.id,
    };

    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseService() : supabase;
    const { data, error } = await writeClient
      .from("products")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error("[ProductsCreate]", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      if (error?.code === "23514") {
        throw new ApiError(400, "Dados invalidos: constraint do banco. Verifique tipo, medidas e estoque do produto.");
      }
      if (error?.code === "23505") {
        throw new ApiError(400, "Dados invalidos: SKU ja existe para este creator.");
      }
      throw new ApiError(500, "Erro ao criar produto");
    }
    revalidateTag(`store-${creator.username}`, "max");
    return ok(data, 201);
  } catch (e) {
    return err(e);
  }
}
