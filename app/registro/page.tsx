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

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const valid =
    name.trim().length > 2 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    password.length >= 6 &&
    password === confirm &&
    acceptedTerms;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!valid) return;
    setLoading(true);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, username, password }),
    });
    const registerPayload = await registerResponse.json();

    if (!registerResponse.ok) {
      setError(registerPayload.error ?? "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError("Conta criada, mas nao foi possivel entrar automaticamente. Faca login.");
      setLoading(false);
      return;
    }

    const sessionResponse = await fetch("/api/auth/session", { credentials: "include" });
    const sessionPayload = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !sessionPayload.data?.creator) {
      setError(sessionPayload.error ?? "Conta criada, mas nao foi possivel preparar sua loja.");
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
            <Input label="Nome completo" value={name} onChange={(event) => setName(event.target.value)} error={submitted && name.trim().length <= 2 ? "Informe seu nome" : ""} />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={submitted && !/^\S+@\S+\.\S+$/.test(email) ? "Email inválido" : ""} />
            <Input
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, ""))}
            />
            <p className="-mt-2 text-xs text-[var(--text-secondary)]">pik.bio/{username || "username"}</p>
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={submitted && password.length < 6 ? "Senha curta" : ""}
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-secondary)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <Input
              label="Confirmar senha"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={submitted && confirm !== password ? "As senhas não conferem" : ""}
            />
            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#FF4D6D]"
              />
              <span>
                Aceito os <Link href="/termos" className="underline hover:text-[#FF4D6D]">Termos de Uso</Link> e a{" "}
                <Link href="/privacidade" className="underline hover:text-[#FF4D6D]">Política de Privacidade</Link>
              </span>
            </label>
            {submitted && !acceptedTerms && (
              <p className="-mt-2 text-xs font-semibold text-red-400">Você precisa aceitar os termos para continuar.</p>
            )}
            <Button loading={loading} className="w-full" type="submit">
              Criar minha loja grátis
            </Button>
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            ou
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
          <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
            Criar conta com Google
          </Button>
          <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#FF4D6D]">
            Já tenho conta
          </Link>
        </Card>
      </div>
    </main>
  );
}


