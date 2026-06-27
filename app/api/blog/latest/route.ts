import { createSupabaseServer } from "@/lib/api/supabase-server";
import { err, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, cover_image_url, published_at, metadata")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    return err(e);
  }
}
