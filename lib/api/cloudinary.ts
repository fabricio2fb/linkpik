import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "@/lib/api/errors";

type UploadType = "product_image" | "creator_avatar" | "store_banner" | "blog_cover";
type ProductKind = "digital" | "physical";

let configured = false;

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(500, "Cloudinary nao configurado");
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }

  return { cloudName, apiKey, apiSecret };
}

export function buildCloudinaryFolder(creatorId: string, type: UploadType, productKind?: ProductKind) {
  if (type === "blog_cover") return `pikbio/blog`;
  const base = `pikbio/creators/${creatorId}`;
  if (type === "creator_avatar") return `${base}/avatar`;
  if (type === "store_banner") return `${base}/store`;
  return `${base}/products/${productKind === "physical" ? "physical" : "digital"}`;
}

export function assertCreatorPublicId(creatorId: string, publicId: string) {
  const prefix = `pikbio/creators/${creatorId}/`;
  if (!publicId.startsWith(prefix) || publicId.includes("../")) {
    throw new ApiError(403, "Imagem nao pertence a este creator");
  }
}

export function signCloudinaryUpload(params: {
  creatorId: string;
  uploadType: UploadType;
  productKind?: ProductKind;
}) {
  const { cloudName, apiKey } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = buildCloudinaryFolder(params.creatorId, params.uploadType, params.productKind);
  const publicId = `${folder}/${randomUUID()}`;
  const signatureParams = {
    folder,
    overwrite: "false",
    public_id: publicId,
    timestamp,
    type: "upload",
  };

  const signature = cloudinary.utils.api_sign_request(signatureParams, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    publicId,
    type: "upload" as const,
    overwrite: false,
  };
}

export async function deleteCloudinaryAsset(publicId: string) {
  getCloudinaryConfig();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  if (!["ok", "not found"].includes(String(result.result))) {
    throw new ApiError(502, "Nao foi possivel remover imagem");
  }
  return result;
}

export function getOptimizedImageUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit";
  gravity?: "auto" | "face";
} = {}) {
  getCloudinaryConfig();
  return cloudinary.url(publicId, {
    secure: true,
    width: options.width,
    height: options.height,
    crop: options.crop ?? "limit",
    gravity: options.gravity,
    quality: "auto",
    fetch_format: "auto",
  });
}
