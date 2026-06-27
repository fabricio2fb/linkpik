"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import BrandLogo from "@/components/BrandLogo"
import Link from "next/link"

export default function PrivacyRequestPage() {
  const [userType, setUserType] = useState("creator")
  const [email, setEmail] = useState("")
  const [requestType, setRequestType] = useState("delete")
  const [notes, setNotes] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmed || !email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), user_type: userType, request_type: requestType, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#22C55E]/10">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Solicitacao recebida</h1>
          <p className="mt-3 text-sm text-gray-600">
            Voce recebera um e-mail de confirmacao em <strong>{email}</strong>. Processamos sua solicitacao em ate 15 dias uteis.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FF4D6D] hover:underline"
          >
            &larr; Voltar ao inicio
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <BrandLogo imageClassName="size-10" textClassName="text-2xl" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Solicitacao de dados</h1>
          <p className="mt-2 text-sm text-gray-500">
            Solicite a exclusao ou exportacao dos seus dados pessoais conforme a LGPD.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium text-gray-700">
              <span>Tipo de conta</span>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="input-base h-11 px-3"
              >
                <option value="creator">Criador (vendedor na plataforma)</option>
                <option value="buyer">Comprador (cliente de um criador)</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="input-base h-11 px-3"
              />
              <span className="text-xs text-gray-400">
                {userType === "creator"
                  ? "O e-mail usado no seu cadastro como criador"
                  : "O e-mail que voce usou ao realizar uma compra"}
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              <span>Tipo de solicitacao</span>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="input-base h-11 px-3"
              >
                <option value="delete">Excluir meus dados</option>
                <option value="export">Exportar meus dados</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              <span>Detalhes adicionais <span className="text-gray-400">(opcional)</span></span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  userType === "buyer"
                    ? "Ex: numero do pedido, nome do criador, etc."
                    : "Informacoes que possam ajudar a localizar seus dados"
                }
                rows={3}
                className="input-base min-h-20 resize-none px-3 py-2"
              />
            </label>

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#FF4D6D]"
              />
              <span>
                Confirmo que sou o titular dos dados informados e entendo que a exclusao e irreversivel
                para os dados que nao precisam ser retidos por obrigacao legal.
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!confirmed || !email.trim()}
              className="w-full"
            >
              Enviar solicitacao
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400">
          Sua identidade sera verificada manualmente antes de qualquer alteracao nos dados.{" "}
          <Link href="/privacidade" className="text-[#FF4D6D] hover:underline">
            Politica de privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
