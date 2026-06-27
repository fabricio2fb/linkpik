import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { sanitizeUrl } from "@/lib/api/sanitize-url";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const LinkTypeSchema = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
  "linkedin",
  "pinterest",
  "twitch",
  "spotify",
  "whatsapp",
  "telegram",
  "discord",
  "website",
  "store",
  "email",
  "custom",
]);

const UpdateLinkSchema = z.object({
  type: LinkTypeSchema.optional(),
  label: z.string().max(100).optional(),
  url: z.string().min(1).max(500).optional(),
  position: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
}).strict();

async function assertOwner(userId: string, linkId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, username").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");

  const { data: link } = await supabase.from("links").select("id, creator_id").eq("id", linkId).single();
  if (!link || link.creator_id !== creator.id) throw new ApiError(403, "Sem permissao");

  return { supabase, creator };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateLinkSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const update = { ...parsed.data };
    if (typeof update.url === "string") {
      update.url = sanitizeUrl(update.url);
      if (!update.url) throw new ApiError(400, "URL invalida");
    }

    const { supabase, creator } = await assertOwner(user.id, id);
    const { data, error } = await supabase.from("links").update(update).eq("id", id).select().single();
    if (error || !data) {
      console.error("[Links:update]", error);
      throw new ApiError(500, error?.message ? `Erro ao atualizar link: ${error.message}` : "Erro ao atualizar link");
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
    const { supabase, creator } = await assertOwner(user.id, id);
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      console.error("[Links:delete]", error);
      throw new ApiError(500, error.message ? `Erro ao remover link: ${error.message}` : "Erro ao remover link");
    }
    revalidateTag(`store-${creator.username}`, "max");
    return ok({ id });
  } catch (e) {
    return err(e);
  }
}
