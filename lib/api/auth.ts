import { ApiError } from "./errors";
import { createSupabaseServer } from "./supabase-server";

export async function getAuthUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new ApiError(401, "Nao autenticado");
  return user;
}

