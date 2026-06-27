"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import Toast from "@/components/ui/Toast"

export default function ManualAddModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [userType, setUserType] = useState("creator")
  const [requestType, setRequestType] = useState("delete")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/privacy/manual-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), user_type: userType, request_type: requestType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast("Pedido criado")
      setOpen(false)
      setEmail("")
      window.setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao criar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Adicionar pedido manual</Button>
      <Modal open={open} title="Adicionar pedido manual" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Input
            label="Email do usuario"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            <span>Tipo de usuario</span>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="input-base h-11 px-3"
            >
              <option value="creator">Creator</option>
              <option value="buyer">Comprador</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            <span>Tipo de pedido</span>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="input-base h-11 px-3"
            >
              <option value="delete">Exclusao</option>
              <option value="export">Exportacao</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Criar pedido</Button>
          </div>
        </form>
      </Modal>
      <Toast message={toast} />
    </>
  )
}
