import { z } from "zod";
import { ensureCreatorAccount } from "@/lib/api/creator-provisioning";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { sanitizeText } from "@/lib/api/sanitize";
import { createSupabaseService } from "@/lib/api/supabase-service";

const RESERVED_USERNAMES = [
  "admin", "api", "dashboard", "login", "registro", "blog", "checkout",
  "acesso", "pedido", "privacidade", "termos", "contato", "afiliado",
  "www", "app", "static", "public", "assets", "_next",
];

const CompleteProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "Apenas letras minusculas, numeros, pontos, underscores e hifens."),
  name: z.string().trim().min(3).max(120),
}).strict();

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseService();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new ApiError(401, "Nao autenticado.");

    const body = await request.json();
    const parsed = CompleteProfileSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos.");

    const username = parsed.data.username.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, 30);
    const name = sanitizeText(parsed.data.name);

    if (RESERVED_USERNAMES.includes(username)) {
      throw new ApiError(409, "Este nome de usuario nao esta disponivel.");
    }

    const { data: existingUsername } = await supabase.from("creators").select("id").eq("username", username).maybeSingle();
    if (existingUsername) throw new ApiError(409, "Este nome de usuario nao esta disponivel.");

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { full_name: name, username },
    });

    if (updateError) throw new ApiError(500, "Erro ao atualizar perfil.");

    const creator = await ensureCreatorAccount({
      id: user.id,
      email: user.email ?? "",
      user_metadata: { full_name: name, username },
    });

    if (!creator) throw new ApiError(500, "Erro ao criar conta do creator.");

    return ok({ creator });
  } catch (e) {
    return err(e);
  }
}
