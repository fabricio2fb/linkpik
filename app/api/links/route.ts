import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getPlanLimits, type Plan } from "@/lib/api/plans";
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

const CreateLinkSchema = z.object({
  type: LinkTypeSchema,
  label: z.string().max(100).optional(),
  url: z.string().min(1).max(500),
  position: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
}).strict();

async function getCreator(userId: string) {
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase.from("creators").select("id, username, plan").eq("user_id", userId).single();
  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { supabase, creator };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const { supabase, creator } = await getCreator(user.id);
    const { data, error } = await supabase.from("links").select("*").eq("creator_id", creator.id).order("position");
    if (error) throw new ApiError(500, "Erro ao buscar links");
    return ok(data ?? []);
  } catch (e) {
    return err(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = CreateLinkSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const safeUrl = sanitizeUrl(parsed.data.url);
    if (!safeUrl) throw new ApiError(400, "URL invalida");

    const { supabase, creator } = await getCreator(user.id);
    const limits = getPlanLimits(creator.plan as Plan);
    const { count } = await supabase.from("links").select("id", { count: "exact", head: true }).eq("creator_id", creator.id);
    if ((count ?? 0) >= limits.max_links) {
      throw new ApiError(403, `Plano ${creator.plan} permite ate ${limits.max_links} links.`);
    }

    const { data, error } = await supabase
      .from("links")
      .insert({ ...parsed.data, url: safeUrl, creator_id: creator.id })
      .select()
      .single();

    if (error || !data) {
      console.error("[Links]", error);
      throw new ApiError(500, error?.message ? `Erro ao criar link: ${error.message}` : "Erro ao criar link");
    }
    revalidateTag(`store-${creator.username}`, "max");
    return ok(data, 201);
  } catch (e) {
    return err(e);
  }
}
