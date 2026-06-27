import { THEME_PRESETS } from "@/lib/theme-presets";
import { createSupabaseService } from "./supabase-service";
import { generateUsername } from "./username";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: unknown;
    username?: unknown;
  };
};

export type ProvisionedCreator = {
  id: string;
  username: string;
  name: string;
  avatar_url?: string | null;
  plan: "free" | "pro";
  payment_enabled: boolean;
  suspended?: boolean;
};

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
}

async function pickUsername(email: string, requested?: unknown) {
  const supabase = createSupabaseService();
  const normalized = typeof requested === "string" ? normalizeUsername(requested) : "";

  if (normalized) {
    const { data: existing } = await supabase.from("creators").select("id").eq("username", normalized).maybeSingle();
    if (!existing) return normalized;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const generated = generateUsername(email);
    const { data: existing } = await supabase.from("creators").select("id").eq("username", generated).maybeSingle();
    if (!existing) return generated;
  }

  return `creator-${crypto.randomUUID().slice(0, 8)}`;
}

export async function ensureCreatorAccount(user: AuthUser): Promise<ProvisionedCreator | null> {
  if (!user.email) return null;

  const supabase = createSupabaseService();
  const selectFields = "id, username, name, avatar_url, plan, payment_enabled, suspended";
  const { data: existing } = await supabase
    .from("creators")
    .select(selectFields)
    .eq("user_id", user.id)
    .maybeSingle();

  let creator = existing as ProvisionedCreator | null;

  if (creator?.suspended) {
    return null;
  }

  if (!creator) {
    const username = await pickUsername(user.email, user.user_metadata?.username);
    const name = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : username;

    const { data: created, error } = await supabase
      .from("creators")
      .insert({
        user_id: user.id,
        username,
        name,
        bio: "Minha loja digital",
        store_theme: THEME_PRESETS.cards,
      })
      .select(selectFields)
      .single();

    if (error || !created) throw error;
    creator = created as ProvisionedCreator;
  }

  await Promise.all([
    supabase.from("creator_settings").upsert({ creator_id: creator.id }, { onConflict: "creator_id" }),
    supabase.from("onboarding_steps").upsert({ creator_id: creator.id }, { onConflict: "creator_id" }),
  ]);

  return creator;
}
