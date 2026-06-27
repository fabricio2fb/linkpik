import { z } from "zod";
import { getAuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseServer } from "@/lib/api/supabase-server";

const PresignedSchema = z.object({
  filename: z.string().max(200),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp", "video/mp4", "application/zip"]),
  size: z.number().max(100 * 1024 * 1024),
}).strict();

// Legacy Supabase upload. New product images use signed Cloudinary uploads.
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const body = await request.json();
    const parsed = PresignedSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Arquivo invalido");

    const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.storage.from("product-files").createSignedUploadUrl(path);
    if (error) throw new ApiError(500, "Erro ao gerar URL");

    return ok({ signed_url: data.signedUrl, path });
  } catch (e) {
    return err(e);
  }
}
