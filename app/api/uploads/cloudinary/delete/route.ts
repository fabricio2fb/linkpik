import { getAuthUser } from "@/lib/api/auth";
import { assertCreatorPublicId, deleteCloudinaryAsset } from "@/lib/api/cloudinary";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";
import { CloudinaryDeleteSchema } from "@/lib/schemas/upload.schema";

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    await applyRateLimit("mutations", user.id);

    const parsed = CloudinaryDeleteSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Imagem invalida");

    const supabase = await createSupabaseServer();
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) throw new ApiError(404, "Creator nao encontrado");
    assertCreatorPublicId(creator.id, parsed.data.publicId);

    await deleteCloudinaryAsset(parsed.data.publicId);
    return ok({ deleted: true });
  } catch (e) {
    return err(e);
  }
}
