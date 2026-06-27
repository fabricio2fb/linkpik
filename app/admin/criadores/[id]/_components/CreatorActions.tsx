"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Toast from "@/components/ui/Toast"

type Props = {
  creatorId: string
  isSuspended: boolean
}

export default function CreatorActions({ creatorId, isSuspended }: Props) {
  const [suspended, setSuspended] = useState(isSuspended)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function toggleSuspend() {
    setLoading("suspend")
    try {
      const res = await fetch(`/api/admin/creators/${creatorId}/suspend`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuspended(data.suspended)
      setToast(data.message)
    } catch {
      setToast("Erro ao alterar status")
    } finally {
      setLoading(null)
    }
  }

  async function forceLogout() {
    if (!confirm("Tem certeza que deseja revogar todas as sessoes deste criador?")) return
    setLoading("logout")
    try {
      const res = await fetch(`/api/admin/creators/${creatorId}/force-logout`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast("Sessoes revogadas")
    } catch {
      setToast("Erro ao revogar sessoes")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={toggleSuspend} loading={loading === "suspend"} variant={suspended ? "primary" : "secondary"}>
          {suspended ? "Reativar conta" : "Suspender conta"}
        </Button>
        <Button onClick={forceLogout} loading={loading === "logout"} variant="secondary">
          Forcar logout
        </Button>
      </div>
      <Toast message={toast} />
    </>
  )
}
