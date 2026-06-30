import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { signCloudinaryUpload } from "@/lib/api/cloudinary";

const UploadTypes = ["product_image", "creator_avatar", "store_banner", "blog_cover"] as const;
const ProductKinds = ["digital", "physical"] as const;

const SignSchema = z.object({
  uploadType: z.enum(UploadTypes),
  productKind: z.enum(ProductKinds).optional(),
  filename: z.string().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json().catch(() => {
      throw new ApiError(400, "JSON invalido");
    });

    const parsed = SignSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Dados invalidos");
    }

    const data = signCloudinaryUpload({
      creatorId: user.id,
      uploadType: parsed.data.uploadType,
      productKind: parsed.data.productKind,
    });

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
