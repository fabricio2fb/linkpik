import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const UpdateAccountSchema = z.object({
  email: z.string().trim().email().max(255).optional(),
  password: z.string().min(6).max(128).optional(),
}).strict();

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = UpdateAccountSchema.safeParse(body);
    if (!parsed.success || (!parsed.data.email && !parsed.data.password)) {
      throw new ApiError(400, "Dados invalidos");
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.updateUser(parsed.data);
    if (error) throw new ApiError(400, error.message);

    return ok({
      id: data.user?.id,
      email: data.user?.email,
      email_change_sent: Boolean(parsed.data.email),
    });
  } catch (e) {
    return err(e);
  }
}
