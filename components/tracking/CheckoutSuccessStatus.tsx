"use client";

import { useEffect, useState } from "react";
import PurchaseTracking from "@/components/tracking/PurchaseTracking";

type CheckoutSuccessStatusProps = {
  orderId: string | null;
  initialStatus: string | null;
  value: number;
  currency: string;
  productTitle: string;
};

export default function CheckoutSuccessStatus({
  orderId,
  initialStatus,
  value,
  currency,
  productTitle,
}: CheckoutSuccessStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [attemptsDone, setAttemptsDone] = useState(false);
  const isPaid = status === "paid";
  const isStillChecking = !isPaid && orderId && !attemptsDone;

  useEffect(() => {
    if (!orderId || initialStatus === "paid") return;

    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/checkout/status?order=${encodeURIComponent(orderId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        const nextStatus = payload.data?.status;
        if (response.ok && nextStatus) setStatus(String(nextStatus));
        if (nextStatus === "paid" || attempts >= 6) {
          setAttemptsDone(true);
          window.clearInterval(interval);
        }
      } catch {
        if (attempts >= 6) {
          setAttemptsDone(true);
          window.clearInterval(interval);
        }
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [initialStatus, orderId]);

  return (
    <>
      {isPaid && orderId && <PurchaseTracking orderId={orderId} value={value} currency={currency} productTitle={productTitle} />}
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#FF4D6D]">
        {isPaid ? "Pagamento confirmado" : "Pedido recebido"}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-extrabold">
        {isPaid ? "Sua compra foi aprovada" : "Confirmando seu pagamento..."}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {isPaid
          ? `O acesso de ${productTitle} sera enviado para o email informado na compra.`
          : isStillChecking
            ? "Estamos conferindo a confirmacao do pagamento. Isso pode levar alguns segundos."
            : "Ainda nao recebemos a confirmacao final. Quando o pagamento for aprovado, voce recebera as instrucoes por email."}
      </p>
    </>
  );
}
