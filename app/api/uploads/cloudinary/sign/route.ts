import { getAuthUser } from "@/lib/api/auth";
import { signCloudinaryUpload } from "@/lib/api/cloudinary";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { CloudinarySignSchema } from "@/lib/schemas/upload.schema";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    await applyRateLimit("mutations", user.id);

    const parsed = CloudinarySignSchema.safeParse(await request.json());
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".");
      throw new ApiError(400, field ? `Upload invalido: ${field}` : "Upload invalido");
    }

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");

    return ok(signCloudinaryUpload({
      creatorId: creator.id,
      uploadType: parsed.data.uploadType,
      productKind: parsed.data.productKind,
    }));
  } catch (e) {
    return err(e);
  }
}
