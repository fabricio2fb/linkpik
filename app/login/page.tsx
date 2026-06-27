"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const emailError = submitted && !/^\S+@\S+\.\S+$/.test(email) ? "Email inválido" : "";
  const passwordError = submitted && password.length < 6 ? "Senha curta" : "";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) return;
    setLoading(true);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }
    const sessionResponse = await fetch("/api/auth/session", { credentials: "include" });
    const sessionPayload = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !sessionPayload.data?.creator) {
      setError(sessionPayload.error ?? "Nao foi possivel preparar sua loja. Confira as migrations do Supabase.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  async function handleGoogleLogin() {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="noise-bg grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <BrandLogo className="justify-center" imageClassName="size-10" textClassName="text-2xl text-[var(--text-primary)]" />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-[var(--text-primary)]">
            Venda pelo seu link da bio
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">Junte-se a criadores que transformaram a bio em loja</p>
        </div>
        <Card className="p-5">
          <form onSubmit={submit} className="grid gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
              placeholder="voce@email.com"
            />
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              placeholder="Sua senha"
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-secondary)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <Button loading={loading} className="w-full" type="submit">
              Entrar
            </Button>
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            ou
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
          <Link href="/registro" className="block text-center text-sm font-semibold text-[#FF4D6D]">
            Criar conta grátis
          </Link>
          <Button variant="secondary" className="mt-4 w-full" onClick={handleGoogleLogin}>
            Entrar com Google
          </Button>
        </Card>
        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          Ao entrar você concorda com os Termos de Uso
        </p>
      </div>
    </main>
  );
}


