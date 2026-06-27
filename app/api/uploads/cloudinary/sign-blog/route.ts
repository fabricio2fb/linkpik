import { signCloudinaryUpload } from "@/lib/api/cloudinary";
import { ApiError } from "@/lib/api/errors";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { err, ok } from "@/lib/api/response";
import { CloudinarySignSchema } from "@/lib/schemas/upload.schema";
import { requireAdminUser } from "@/lib/admin/guard";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) throw new ApiError(401, "Nao autorizado");
    await applyRateLimit("mutations", adminUser.email);

    const parsed = CloudinarySignSchema.safeParse(await request.json());
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".");
      throw new ApiError(400, field ? `Upload invalido: ${field}` : "Upload invalido");
    }

    return ok(signCloudinaryUpload({
      creatorId: "admin",
      uploadType: parsed.data.uploadType,
      productKind: parsed.data.productKind,
    }));
  } catch (e) {
    return err(e);
  }
}
