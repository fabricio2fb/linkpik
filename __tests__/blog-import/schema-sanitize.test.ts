import { parseBlogImportPayload } from "@/lib/blog-import/schema";
import { sanitizeImportedBlogHtml } from "@/lib/blog-import/sanitize";
import { BlogImportError } from "@/lib/blog-import/errors";

describe("blog import schema and sanitize", () => {
  it("accepts test action", () => {
    expect(parseBlogImportPayload({ action: "test" })).toEqual({ action: "test" });
  });

  it("rejects invalid slug", () => {
    expect(() => parseBlogImportPayload({
      action: "upsert",
      post: {
        externalId: "ext-1",
        title: "Titulo",
        slug: "Slug Invalido",
        htmlContent: "<p>ok</p>",
      },
    })).toThrow(BlogImportError);
  });

  it("forces imported status to be handled outside payload", () => {
    const parsed = parseBlogImportPayload({
      action: "upsert",
      post: {
        externalId: "ext-1",
        title: "Titulo",
        slug: "titulo",
        htmlContent: "<p>ok</p>",
        status: "published",
      },
    });

    expect(parsed.action).toBe("upsert");
    if (parsed.action === "upsert") expect(parsed.post.status).toBe("published");
  });

  it("preserves allowed blog classes", () => {
    expect(sanitizeImportedBlogHtml('<div class="blog-cta unknown"><a href="https://pik.bio">ok</a></div>'))
      .toContain("blog-cta");
  });

  it("rejects dangerous html", () => {
    expect(() => sanitizeImportedBlogHtml('<p onclick="alert(1)">x</p>')).toThrow(BlogImportError);
    expect(() => sanitizeImportedBlogHtml("<script>alert(1)</script>")).toThrow(BlogImportError);
    expect(() => sanitizeImportedBlogHtml('<a href="javascript:alert(1)">x</a>')).toThrow(BlogImportError);
  });
});
