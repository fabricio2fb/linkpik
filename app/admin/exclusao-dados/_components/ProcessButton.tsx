"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Toast from "@/components/ui/Toast"

type Props = {
  requestId: string
}

export default function ProcessButton({ requestId }: Props) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleProcess() {
    if (!confirm("Tem certeza? Esta acao anonimiza dados do usuario permanentemente.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/privacy/${requestId}/process`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast("Pedido processado com sucesso")
      window.setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao processar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleProcess} loading={loading} variant="secondary">
        Processar
      </Button>
      <Toast message={toast} />
    </>
  )
}
