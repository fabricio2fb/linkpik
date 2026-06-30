"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Step = "email" | "code" | "password";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const passwordValid = password.length >= 6 && password.length <= 128 && password === confirm;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Informe um email válido.");
      return;
    }

    setLoading(true);

    try {
      const rateResponse = await fetch("/api/auth/rate-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password-reset" }),
      });

      if (!rateResponse.ok) {
        setError("Muitas tentativas. Aguarde alguns minutos.");
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) {
        console.error("[PasswordReset]", resetError);
      }
    } catch {
      console.error("[PasswordReset] Erro inesperado");
    }

    setLoading(false);
    setStep("code");
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!/^\d{6,10}$/.test(code)) {
      setError("Código inválido.");
      return;
    }

    setLoading(true);

    try {
      const rateResponse = await fetch("/api/auth/rate-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password-reset-verify", identifier: email }),
      });

      if (!rateResponse.ok) {
        setError("Muitas tentativas. Solicite um novo código.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });

      if (verifyError) {
        setError("Código inválido ou expirado. Solicite um novo.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Erro ao verificar código. Tente novamente.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("password");
  }

  async function handleUpdatePassword(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");

    if (!passwordValid) return;

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/login?senha_alterada=true");
  }

  return (
    <main className="noise-bg grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <BrandLogo className="justify-center" imageClassName="size-10" textClassName="text-2xl text-[var(--text-primary)]" />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-[var(--text-primary)]">
            {step === "email" && "Recuperar senha"}
            {step === "code" && "Código de verificação"}
            {step === "password" && "Nova senha"}
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            {step === "email" && "Digite seu e-mail e enviaremos um código de verificação."}
            {step === "code" && "Digite o código enviado para seu e-mail."}
            {step === "password" && "Escolha uma senha forte para sua conta."}
          </p>
        </div>
        <Card className="p-5">
          {step === "email" && (
            <form onSubmit={handleSendCode} className="grid gap-4">
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                error={error}
              />
              <Button loading={loading} className="w-full" type="submit">
                Enviar código
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="grid gap-4">
              <Input
                label="E-mail"
                type="email"
                value={email}
                disabled
              />
              <Input
                label="Código"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Digite o código"
                maxLength={10}
                error={error}
                className="text-center text-2xl font-bold tracking-[0.3em]"
              />
              <Button loading={loading} className="w-full" type="submit">
                Verificar código
              </Button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); }}
                className="text-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[#FF4D6D] transition"
              >
                Trocar e-mail
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleUpdatePassword} className="grid gap-4">
              <Input
                label="Nova senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={submitted && password.length < 6 ? "A senha deve ter no mínimo 6 caracteres" : ""}
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
              <Button loading={loading} className="w-full" type="submit">
                Alterar senha
              </Button>
              {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
            </form>
          )}

          {step !== "password" && error && <p className="mt-3 text-center text-sm font-semibold text-red-400">{error}</p>}

          {step === "email" && (
            <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#FF4D6D]">
              Voltar para o login
            </Link>
          )}

          {step === "code" && (
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); setCode(""); }}
              className="mt-5 block w-full text-center text-sm font-semibold text-[#FF4D6D]"
            >
              Reenviar código
            </button>
          )}
        </Card>
      </div>
    </main>
  );
}
