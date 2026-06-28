"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"

interface PinTotpGateProps {
  adminEmail: string
  totpConfigured: boolean
}

type Step = "setup" | "totp"

export default function PinTotpGate({ adminEmail, totpConfigured }: PinTotpGateProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(totpConfigured ? "totp" : "setup")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const setupFetchedRef = useRef(false)

  useEffect(() => {
    if (step === "setup" && !setupFetchedRef.current) {
      setupFetchedRef.current = true
      setupTotp()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function setupTotp() {
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/setup-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (res.status === 403) {
        setError("TOTP já foi configurado anteriormente.")
        setStep("totp")
        return
      }

      if (!res.ok) {
        setError("Erro ao gerar QR code.")
        return
      }

      const data = await res.json()
      const qr = await QRCode.toDataURL(data.uri, { width: 256, margin: 2 })
      setQrDataUrl(qr)
    } catch {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (res.status === 429) {
        setError("Muitas tentativas. Tente novamente mais tarde.")
        return
      }

      const data = await res.json()
      if (!data.success) {
        setError("Código inválido")
        return
      }

      router.refresh()
    } catch {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="mt-1 break-all text-sm text-gray-500">{adminEmail}</p>
        </div>

        {step === "setup" && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Configurar 2FA
            </h2>
            <p className="text-sm text-gray-600">
              Escaneie o QR code abaixo com seu aplicativo autenticador
              (Google Authenticator, Authy, etc.).
            </p>

            {loading && qrDataUrl === "" && (
              <p className="text-sm text-gray-500">Gerando QR code...</p>
            )}

            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code para configurar 2FA"
                  className="h-56 w-56 rounded-lg border sm:h-64 sm:w-64"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700">
                Código de verificação
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Após escanear, digite o código de 6 dígitos gerado pelo aplicativo.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                maxLength={6}
                required
              />
            </div>

            <button
              type="button"
              onClick={handleTotpSubmit}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Confirmar e ativar"}
            </button>
          </div>
        )}

        {step === "totp" && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código do autenticador
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                maxLength={6}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
