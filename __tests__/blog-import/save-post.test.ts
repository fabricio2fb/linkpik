import { saveImportedPost } from "@/lib/blog-import/save-post";
import { BlogImportError } from "@/lib/blog-import/errors";

const state = {
  byExternal: null as Record<string, any> | null,
  bySlug: null as Record<string, any> | null,
  saved: null as Record<string, any> | null,
  updatedConflictMetadata: null as Record<string, any> | null,
};

function result(data: unknown, error: unknown = null) {
  return Promise.resolve({ data, error });
}

function makeQuery(table: string) {
  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn((field: string) => {
      query.field = field;
      return query;
    }),
    maybeSingle: jest.fn(() => {
      if (query.field === "external_id") return result(state.byExternal);
      if (query.field === "slug") return result(state.bySlug);
      return result(null);
    }),
    single: jest.fn(() => result(state.saved ?? {
      id: "local-1",
      external_id: "ext-1",
      title: "Titulo",
      slug: "titulo",
      status: "draft",
    })),
  };
  return query;
}

const supabaseMock = {
  from: jest.fn((table: string) => ({
    select: jest.fn(() => makeQuery(table)),
    insert: jest.fn((payload: Record<string, unknown>) => {
      state.saved = {
        id: "local-created",
        external_id: payload.external_id,
        title: payload.title,
        slug: payload.slug,
        status: payload.status,
      };
      return makeQuery(table);
    }),
    update: jest.fn((payload: Record<string, unknown>) => {
      state.updatedConflictMetadata = payload.metadata as Record<string, unknown>;
      state.saved = {
        id: state.byExternal?.id ?? "local-updated",
        external_id: payload.external_id,
        title: payload.title,
        slug: payload.slug,
        status: payload.status,
      };
      return makeQuery(table);
    }),
  })),
};

jest.mock("@/lib/api/supabase-service", () => ({
  createSupabaseService: () => supabaseMock,
}));

const post = {
  externalId: "ext-1",
  title: "Titulo",
  slug: "titulo",
  excerpt: "Resumo",
  htmlContent: "<p>ok</p>",
  secondaryKeywords: [],
};

describe("saveImportedPost", () => {
  beforeEach(() => {
    state.byExternal = null;
    state.bySlug = null;
    state.saved = null;
    state.updatedConflictMetadata = null;
    process.env.NEXT_PUBLIC_APP_URL = "https://pik.bio";
    jest.clearAllMocks();
  });

  it("creates a draft post mapped to Pikbio fields", async () => {
    const saved = await saveImportedPost({ post, cleanHtml: "<p>ok</p>" });
    expect(saved.action).toBe("created");
    expect(saved.post.status).toBe("draft");
    expect(saved.post.url).toBe("https://pik.bio/blog/titulo");
  });

  it("updates when externalId already exists", async () => {
    state.byExternal = { id: "local-1", external_id: "ext-1", slug: "titulo", metadata: { source: "generator" } };
    state.bySlug = state.byExternal;
    const saved = await saveImportedPost({ post, cleanHtml: "<p>novo</p>" });
    expect(saved.action).toBe("updated");
    expect(saved.post.remoteId).toBe("local-1");
  });

  it("rejects slug conflict with manual post", async () => {
    state.bySlug = { id: "manual-1", external_id: null, slug: "titulo", metadata: {} };
    await expect(saveImportedPost({ post, cleanHtml: "<p>ok</p>" })).rejects.toMatchObject({
      code: "SLUG_CONFLICT",
    });
  });

  it("rejects manual edit conflict", async () => {
    state.byExternal = {
      id: "local-1",
      external_id: "ext-1",
      slug: "titulo",
      metadata: {
        source: "generator",
        importedAt: "2026-07-18T00:00:00.000Z",
        lastManualEditAt: "2026-07-19T00:00:00.000Z",
      },
    };
    state.bySlug = state.byExternal;
    await expect(saveImportedPost({ post, cleanHtml: "<p>ok</p>" })).rejects.toBeInstanceOf(BlogImportError);
    expect(state.updatedConflictMetadata?.importConflict).toBe(true);
  });
});
