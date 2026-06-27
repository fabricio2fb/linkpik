"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

type PurchaseLookupModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function PurchaseLookupModal({ open, onClose }: PurchaseLookupModalProps) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  function openPurchaseLink() {
    const value = link.trim();
    setError("");

    if (!value) {
      setError("Cole o link recebido por email.");
      return;
    }

    try {
      const url = new URL(value, window.location.origin);
      const isDigitalAccess = url.pathname.startsWith("/acesso/");
      const isPhysicalStatus = url.pathname.startsWith("/pedido/status/");

      if (!isDigitalAccess && !isPhysicalStatus) {
        setError("Use um link de acesso ou rastreio enviado pelo Pikbio.");
        return;
      }

      window.location.href = `${url.pathname}${url.search}`;
    } catch {
      setError("Link invalido.");
    }
  }

  return (
    <Modal open={open} title="Acompanhar minha compra" onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 p-5">
        <Input
          label="Link recebido por email"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://pikbio.com/acesso/... ou /pedido/status/..."
        />
        {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
        <Button className="w-full" onClick={openPurchaseLink}>
          <Search size={16} />
          Abrir minha compra
        </Button>
      </div>
    </Modal>
  );
}
