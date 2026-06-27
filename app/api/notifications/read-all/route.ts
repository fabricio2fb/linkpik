import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function PATCH() {
  try {
    const user = await getAuthUser();
    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("creator_id", creator.id)
      .is("read_at", null);

    return ok({ read: true });
  } catch (e) {
    return err(e);
  }
}

