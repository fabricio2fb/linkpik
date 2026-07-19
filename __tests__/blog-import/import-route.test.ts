import { POST } from "@/app/api/blog/import/route";

function request(body: string, token?: string) {
  return new Request("https://pik.bio/api/blog/import", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
}

describe("POST /api/blog/import", () => {
  beforeEach(() => {
    process.env.BLOG_IMPORT_TOKEN = "test-token";
  });

  it("rejects missing token", async () => {
    const response = await POST(request(JSON.stringify({ action: "test" })));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("rejects wrong token", async () => {
    const response = await POST(request(JSON.stringify({ action: "test" }), "wrong-token"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("accepts test action without saving data", async () => {
    const response = await POST(request(JSON.stringify({ action: "test" }), "test-token"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      action: "test",
      site: {
        name: "Pikbio",
        slug: "pikbio",
        domain: "pik.bio",
      },
      message: "Conexão realizada com sucesso.",
    });
  });

  it("rejects invalid json", async () => {
    const response = await POST(request("{invalid-json", "test-token"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_PAYLOAD");
  });
});
