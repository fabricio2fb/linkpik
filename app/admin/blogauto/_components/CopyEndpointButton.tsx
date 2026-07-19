"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import Toast from "@/components/ui/Toast";

export default function CopyEndpointButton({ endpoint }: { endpoint: string }) {
  const [toast, setToast] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard?.writeText(endpoint);
    setToast("Endpoint copiado");
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#FF4D6D] px-4 text-sm font-semibold text-white transition hover:bg-[#FF2D55]"
      >
        <Copy size={16} />
        Copiar endpoint
      </button>
      <Toast message={toast} />
    </>
  );
}
