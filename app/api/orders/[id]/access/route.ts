import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    const { id } = await context.params;
    const supabase = await createSupabaseServer();

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, product_id, buyer_email")
      .eq("id", id)
      .single();

    const isOwner = order?.buyer_email === user.email;
    if (!order || order.status !== "paid" || !isOwner) throw new ApiError(403, "Acesso negado");

    const { data: product } = await supabase.from("products").select("file_url, type, product_kind").eq("id", order.product_id).single();
    if (product?.product_kind === "physical" || product?.type === "fisico") throw new ApiError(403, "Produto fisico nao possui download digital");
    if (!product?.file_url) throw new ApiError(404, "Arquivo nao encontrado");

    const { data, error } = await supabase.storage.from("product-files").createSignedUrl(product.file_url, 1800);
    if (error) throw new ApiError(500, "Erro ao gerar acesso");

    return ok({ download_url: data.signedUrl });
  } catch (e) {
    return err(e);
  }
}
