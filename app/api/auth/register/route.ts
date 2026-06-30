import { z } from "zod";
import { ensureCreatorAccount } from "@/lib/api/creator-provisioning";
import { ApiError } from "@/lib/api/errors";
import { sendWelcomeEmail } from "@/lib/api/mailer";
import { err, ok } from "@/lib/api/response";
import { sanitizeText } from "@/lib/api/sanitize";
import { createSupabaseService } from "@/lib/api/supabase-service";

type SupabaseMutationError = {
  code?: string;
  details?: string;
  message?: string;
};

const RegisterSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
  username: z.string().trim().max(30).optional(),
}).strict();

function registrationError(message: string, error?: SupabaseMutationError | null) {
  if (error) {
    console.error("[Register]", {
      message,
      code: error.code,
      details: error.details,
      supabaseMessage: error.message,
    });
  }

  if (error?.code === "23505") return new ApiError(409, "Email ou username ja esta em uso.");
  if (error?.code === "42501") return new ApiError(500, "Sem permissao para inserir em creators. Confira a SUPABASE_SERVICE_ROLE_KEY.");
  return new ApiError(500, error?.message ? `${message}: ${error.message}` : message);
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Dados invalidos.");

    const supabase = createSupabaseService();
    const email = parsed.data.email.toLowerCase();
    const name = sanitizeText(parsed.data.name);
    const username = parsed.data.username
      ?.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 30);

    if (username) {
      const { data: existingUsername } = await supabase.from("creators").select("id").eq("username", username).maybeSingle();
      if (existingUsername) throw new ApiError(409, "Username ja esta em uso.");
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        username: username ?? "",
      },
    });

    if (authError || !authData.user) {
      throw new ApiError(authError?.status === 422 ? 409 : 500, authError?.message ?? "Erro ao criar usuario.");
    }

    createdUserId = authData.user.id;

    const creator = await ensureCreatorAccount({
      id: authData.user.id,
      email,
      user_metadata: {
        full_name: name,
        username,
      },
    });

    if (!creator) throw registrationError("Erro ao criar creator");

    sendWelcomeEmail({
      to: email,
      name,
      username: creator.username ?? username ?? "",
    }).catch((err) => console.error("[WelcomeEmail]", err));

    return ok({ creator });
  } catch (e) {
    if (createdUserId) {
      await createSupabaseService().auth.admin.deleteUser(createdUserId);
    }
    return err(e);
  }
}
