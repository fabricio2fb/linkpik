import { revalidateTag } from "next/cache";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { sanitizeText } from "@/lib/api/sanitize";
import { sanitizeUrl } from "@/lib/api/sanitize-url";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { UpdateCreatorSchema, UpdateThemeSchema } from "@/lib/schemas/creator.schema";

function sanitizeImageUrl(input: string) {
  const safeUrl = sanitizeUrl(input);
  if (!safeUrl) return "";
  try {
    const url = new URL(safeUrl);
    const allowed = url.protocol === "https:" && (url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".supabase.co"));
    return allowed ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.from("creators").select("*").eq("user_id", user.id).single();
    if (error || !data) throw new ApiError(404, "Creator nao encontrado");
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = UpdateCreatorSchema.merge(UpdateThemeSchema).safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const { theme, ...creatorUpdate } = parsed.data;
    const update: Record<string, unknown> = { ...creatorUpdate };
    if (theme) update.store_theme = theme;
    if (typeof update.name === "string") update.name = sanitizeText(update.name);
    if (typeof update.bio === "string") update.bio = sanitizeText(update.bio);
    if (typeof update.username === "string") update.username = sanitizeText(update.username);
    if (typeof update.avatar_url === "string") update.avatar_url = sanitizeImageUrl(update.avatar_url);
    if (typeof update.cover_url === "string") update.cover_url = sanitizeImageUrl(update.cover_url);

    const supabase = await createSupabaseServer();
    const { data: previous } = await supabase.from("creators").select("username").eq("user_id", user.id).single();
    const { data, error } = await supabase
      .from("creators")
      .update(update)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) throw new ApiError(500, "Erro ao atualizar");
    if (previous?.username && previous.username !== data.username) revalidateTag(`store-${previous.username}`, "max");
    revalidateTag(`store-${data.username}`, "max");
    return ok(data);
  } catch (e) {
    return err(e);
  }
}
