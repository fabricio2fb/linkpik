"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function InventoryAdjustmentModal({
  open,
  onClose,
  product = "Caneca Creator",
  productId,
  currentStock = "8 unidades",
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  product?: string;
  productId?: string;
  currentStock?: string;
  onSaved?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setSaved(false);
    const delta = Number(quantity);
    if (!Number.isInteger(delta) || delta === 0) {
      setError("Informe uma quantidade inteira diferente de zero.");
      return;
    }

    if (!productId) {
      setSaved(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/fisicos/estoque/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity_delta: delta, reason: reason || "Ajuste manual" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Erro ao salvar ajuste.");
        return;
      }
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Erro de conexao ao salvar ajuste.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Repor estoque" maxWidth="max-w-md">
      <div className="grid gap-4 p-5">
        <Input label="Produto" value={product} readOnly />
        <Input label="Estoque atual" value={currentStock} readOnly />
        <Input label="Quantidade a adicionar" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/[^\d-]/g, ""))} placeholder="Ex: 40" />
        <Textarea label="Observacao" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Compra de reposicao, ajuste manual ou contagem fisica." />
        <Button loading={loading} onClick={save}>Salvar ajuste</Button>
        {error && <p className="rounded-[8px] border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-400">{error}</p>}
        {saved && <p className="rounded-[8px] border border-[#22C55E]/20 bg-[#22C55E]/10 p-3 text-sm font-bold text-[#22C55E]">{productId ? "Ajuste de estoque salvo." : "Ajuste salvo visualmente. Nenhuma API foi chamada."}</p>}
      </div>
    </Modal>
  );
}
