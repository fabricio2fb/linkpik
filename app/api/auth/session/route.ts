import { applyRateLimit } from "@/lib/api/rate-limit";
import { ensureCreatorAccount } from "@/lib/api/creator-provisioning";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export async function GET(request: Request) {
  try {
    await applyRateLimit("auth", request.headers.get("x-forwarded-for") ?? "unknown");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return ok(null);

    const activeCreator = await ensureCreatorAccount(user);

    return ok({ id: user.id, email: user.email, creator: activeCreator ?? null });
  } catch (e) {
    return err(e);
  }
}
