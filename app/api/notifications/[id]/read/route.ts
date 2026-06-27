import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    const { data: notif } = await supabase.from("notifications").select("id, creator_id").eq("id", id).single();
    if (!notif || notif.creator_id !== creator.id) throw new ApiError(403, "Sem permissao");

    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    return ok({ read: true });
  } catch (e) {
    return err(e);
  }
}

