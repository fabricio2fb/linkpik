export type BlogImportErrorCode =
  | "INVALID_TOKEN"
  | "INVALID_PAYLOAD"
  | "INVALID_SLUG"
  | "SLUG_CONFLICT"
  | "HTML_REJECTED"
  | "POST_NOT_FOUND"
  | "DATABASE_ERROR"
  | "SCHEMA_ERROR"
  | "MANUAL_EDIT_CONFLICT"
  | "INTERNAL_ERROR";

export class BlogImportError extends Error {
  constructor(
    public code: BlogImportErrorCode,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "BlogImportError";
  }
}

export function blogImportErrorResponse(error: unknown) {
  if (error instanceof BlogImportError) {
    return Response.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  const label = error instanceof Error ? error.name : typeof error;
  console.error("[BlogImport]", label, error);
  return Response.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno." } },
    { status: 500 },
  );
}
