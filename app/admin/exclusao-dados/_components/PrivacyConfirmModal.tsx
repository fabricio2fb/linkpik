"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Toast from "@/components/ui/Toast"

type Props = {
  requestId: string
  email: string
  requestType: string
  userType: string
}

export default function PrivacyConfirmModal({ requestId, email, requestType, userType }: Props) {
  const [open, setOpen] = useState(false)
  const [typedEmail, setTypedEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isDelete = requestType === "delete"
  const emailMatches = typedEmail.trim().toLowerCase() === email.toLowerCase()

  async function handleConfirm() {
    if (!emailMatches) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/privacy/${requestId}/process`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.type === "export") {
        const jsonStr = JSON.stringify(data.data, null, 2)
        const blob = new Blob([jsonStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `exportacao-lgpd-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setToast("Arquivo exportado com sucesso")
      } else {
        setToast("Dados anonimizados com sucesso")
      }

      setOpen(false)
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao processar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={isDelete ? "secondary" : "primary"}
      >
        {isDelete ? "Processar" : "Exportar"}
      </Button>
      <Modal
        open={open}
        title={isDelete ? "Confirmar anonimizacao" : "Confirmar exportacao"}
        onClose={() => { setOpen(false); setTypedEmail("") }}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className={`rounded-xl p-4 text-sm ${
            isDelete
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-blue-200 bg-blue-50 text-blue-800"
          }`}>
            <p className="font-semibold">
              {isDelete
                ? "Esta acao anonimiza os dados permanentemente. Nao e possivel desfazer."
                : "Esta acao gera um arquivo JSON com os dados cadastrados deste usuario."}
            </p>
            <p className="mt-2">
              {isDelete
                ? `Usuario: ${userType === "creator" ? "Creator" : "Comprador"}`
                : `Dados de ${userType === "creator" ? "Creator" : "Comprador"} serao exportados`}
            </p>
          </div>

          <div className="text-sm text-gray-700">
            <p className="font-medium">Digite o email abaixo para confirmar:</p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-[#FF4D6D]">{email}</p>
          </div>

          <input
            type="text"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder="Digite o email exato acima"
            className="input-base h-11 px-3"
            autoComplete="off"
          />

          <div className="grid gap-3 pt-2 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setOpen(false); setTypedEmail("") }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={!emailMatches}
              variant={isDelete ? "primary" : "secondary"}
            >
              {isDelete ? "Anonimizar dados" : "Exportar dados"}
            </Button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  )
}
