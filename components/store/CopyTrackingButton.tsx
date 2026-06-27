"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function CopyTrackingButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button variant="secondary" onClick={copy}>
      <Copy size={16} />
      {copied ? "Copiado" : "Copiar rastreio"}
    </Button>
  );
}
