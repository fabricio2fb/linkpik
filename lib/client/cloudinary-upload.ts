type UploadType = "product_image" | "creator_avatar" | "store_banner";
type ProductKind = "digital" | "physical";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File, maxSizeBytes: number) {
  if (!allowedMimeTypes.includes(file.type)) return "Formato nao permitido. Use JPG, PNG ou WEBP.";
  if (file.size > maxSizeBytes) return `Imagem muito grande. Use ate ${Math.round(maxSizeBytes / 1024 / 1024)} MB.`;
  return "";
}

export async function uploadSignedCloudinaryImage(params: {
  file: File;
  uploadType: UploadType;
  productKind?: ProductKind;
}) {
  const signResponse = await fetch("/api/uploads/cloudinary/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadType: params.uploadType,
      productKind: params.productKind,
      filename: params.file.name,
      mimeType: params.file.type,
      size: params.file.size,
    }),
  });
  const signPayload = await signResponse.json().catch(() => ({}));
  if (!signResponse.ok) throw new Error(signPayload.error ?? "Nao conseguimos preparar o upload.");

  const data = signPayload.data;
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("api_key", data.apiKey);
  formData.append("timestamp", String(data.timestamp));
  formData.append("signature", data.signature);
  formData.append("folder", data.folder);
  formData.append("public_id", data.publicId);
  formData.append("type", "upload");
  formData.append("overwrite", "false");

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const uploadPayload = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok || !uploadPayload.secure_url || !uploadPayload.public_id) {
    throw new Error("Nao conseguimos enviar a imagem agora.");
  }

  return {
    url: String(uploadPayload.secure_url),
    publicId: String(uploadPayload.public_id),
  };
}
