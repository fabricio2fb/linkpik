import { SITE_CONFIG } from "@/lib/site-config";
import { BlogImportError, blogImportErrorResponse } from "@/lib/blog-import/errors";
import { parseBlogImportPayload } from "@/lib/blog-import/schema";
import { sanitizeImportedBlogHtml } from "@/lib/blog-import/sanitize";
import { saveImportedPost } from "@/lib/blog-import/save-post";

function timingSafeStringEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let result = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= leftBytes[index] ^ rightBytes[index];
  }
  return result === 0;
}

function assertImportToken(request: Request) {
  const configured = process.env.BLOG_IMPORT_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (!configured || !token || !timingSafeStringEqual(token, configured)) {
    throw new BlogImportError("INVALID_TOKEN", 401, "Token invalido.");
  }
}

export async function POST(request: Request) {
  try {
    assertImportToken(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BlogImportError("INVALID_PAYLOAD", 400, "JSON invalido.");
    }

    const payload = parseBlogImportPayload(body);

    if (payload.action === "test") {
      return Response.json({
        success: true,
        action: "test",
        site: SITE_CONFIG,
        message: "Conexao realizada com sucesso.",
      });
    }

    const cleanHtml = sanitizeImportedBlogHtml(payload.post.htmlContent);
    const result = await saveImportedPost({ post: payload.post, cleanHtml });

    return Response.json({
      success: true,
      action: result.action,
      post: result.post,
    }, { status: result.action === "created" ? 201 : 200 });
  } catch (error) {
    return blogImportErrorResponse(error);
  }
}
