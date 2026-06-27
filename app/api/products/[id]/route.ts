import { revalidateTag } from "next/cache";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { parseAndValidateProductPageSections } from "@/lib/api/product-page-sections";
import { sanitizeProductUrlFields } from "@/lib/api/product-sanitize";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { UpdateProductSchema } from "@/lib/schemas/product.schema";
import type { Product } from "@/lib/types";

async function getCreator(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, username").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

async function assertProductOwner(userId: string, productId: string) {
  const { supabase, creator } = await getCreator(userId);
  const { data: product } = await supabase.from("products").select("id, creator_id, price, details").eq("id", productId).single();
  if (!product || product.creator_id !== creator.id) throw new ApiError(403, "Sem permissao");
  return { supabase, creator, product };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    const { id } = await context.params;
    const { supabase, creator } = await assertProductOwner(user.id, id);
    const { data, error } = await supabase.from("products").select("*").eq("id", id).eq("creator_id", creator.id).single();
    if (error || !data || (!FEATURE_PHYSICAL_PRODUCT && (data.type === "fisico" || data.product_kind === "physical"))) throw new ApiError(404, "Produto nao encontrado");
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      throw new ApiError(400, field ? `Dados invalidos: ${field}` : "Dados invalidos");
    }

    const sanitizedProduct = sanitizeProductUrlFields(parsed.data);
    if (!FEATURE_PHYSICAL_PRODUCT && (sanitizedProduct.type === "fisico" || sanitizedProduct.product_kind === "physical")) {
      throw new ApiError(404, "Recurso nao encontrado");
    }
    const { supabase, creator, product } = await assertProductOwner(user.id, id);
    if (sanitizedProduct.page_sections) {
      const details = product.details && typeof product.details === "object" && !Array.isArray(product.details)
        ? product.details as Record<string, unknown>
        : {};
      sanitizedProduct.page_sections = parseAndValidateProductPageSections(sanitizedProduct.page_sections, {
        price: typeof sanitizedProduct.price === "number" ? sanitizedProduct.price : Number(product.price ?? 0),
        billingType: sanitizedProduct.details?.billingType ?? (details.billingType as Product["billingType"]),
      });
    }
    if (sanitizedProduct.upsell_id) {
      const { data: upsell } = await supabase
        .from("products")
        .select("id")
        .eq("id", sanitizedProduct.upsell_id)
        .eq("creator_id", creator.id)
        .single();
      if (!upsell) throw new ApiError(400, "Produto de upsell invalido");
    }

    const updateData = {
      ...sanitizedProduct,
      ...(sanitizedProduct.status ? { is_active: sanitizedProduct.status === "active" } : {}),
    };

    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseService() : supabase;
    const { data, error } = await writeClient.from("products").update(updateData).eq("id", id).eq("creator_id", creator.id).select().single();
    if (error || !data) {
      console.error("[ProductsUpdate]", { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
      if (error?.code === "23505") {
        throw new ApiError(400, "Dados invalidos: SKU ja existe para este creator.");
      }
      if (error?.code === "23514") {
        throw new ApiError(400, "Dados invalidos: constraint do banco. Verifique tipo, medidas e estoque do produto.");
      }
      throw new ApiError(500, "Erro ao atualizar produto");
    }
    revalidateTag(`store-${creator.username}`, "max");
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    const { id } = await context.params;
    const { supabase, creator } = await assertProductOwner(user.id, id);
    const { error } = await supabase.from("products").delete().eq("id", id).eq("creator_id", creator.id);
    if (error) throw new ApiError(500, "Erro ao remover produto");
    revalidateTag(`store-${creator.username}`, "max");
    return ok({ id });
  } catch (e) {
    return err(e);
  }
}
