import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { sanitizeText } from "@/lib/api/sanitize";
import { sanitizeUrl } from "@/lib/api/sanitize-url";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const MigrateSchema = z.object({
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  theme: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = MigrateSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos");

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase
      .from("creators")
      .select("id, username, name, bio, avatar_url, cover_url, store_theme")
      .eq("user_id", user.id)
      .single();

    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const updates: Record<string, unknown> = {};
    const cfg = parsed.data.config;

    if (cfg) {
      if (typeof cfg.name === "string" && creator.name === creator.username) {
        updates.name = sanitizeText(cfg.name).slice(0, 100);
      }
      if (typeof cfg.bio === "string" && !creator.bio) {
        updates.bio = sanitizeText(cfg.bio).slice(0, 500);
      }
      if (typeof cfg.avatar_url === "string" && !creator.avatar_url) {
        const safe = sanitizeUrl(cfg.avatar_url);
        if (safe) updates.avatar_url = safe;
      }
      if (typeof cfg.cover_url === "string" && !creator.cover_url) {
        const safe = sanitizeUrl(cfg.cover_url);
        if (safe) updates.cover_url = safe;
      }
    }

    if (parsed.data.theme && !creator.store_theme) {
      updates.store_theme = parsed.data.theme;
    }

    if (Object.keys(updates).length === 0) {
      return ok({ migrated: false, reason: "Nada a migrar" });
    }

    await supabase.from("creators").update(updates).eq("user_id", user.id);
    revalidateTag(`store-${creator.username}`, "max");
    return ok({ migrated: true, fields: Object.keys(updates) });
  } catch (e) {
    return err(e);
  }
}
