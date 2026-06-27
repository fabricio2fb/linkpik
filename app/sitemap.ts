import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type BlogPostSitemapRow = {
  slug: string;
  published_at: string | null;
  updated_at?: string | null;
};

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/como-funciona", changeFrequency: "monthly", priority: 0.9 },
  { path: "/demo", changeFrequency: "monthly", priority: 0.75 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contato", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.3 },
  { path: "/termos", changeFrequency: "yearly", priority: 0.3 },
];

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio").replace(/\/$/, "");
}

async function getPublishedBlogPosts(): Promise<BlogPostSitemapRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const posts = await getPublishedBlogPosts();

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at ?? post.published_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
