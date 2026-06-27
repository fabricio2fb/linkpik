"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: {
      track?: (...args: unknown[]) => void;
    };
  }
}

type PurchaseTrackingProps = {
  orderId: string;
  value: number;
  currency: string;
  productTitle: string;
};

export default function PurchaseTracking({ orderId, value, currency, productTitle }: PurchaseTrackingProps) {
  useEffect(() => {
    const key = `pikbio_purchase_${orderId}`;
    if (sessionStorage.getItem(key)) return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (window.fbq) {
        window.fbq("track", "Purchase", { value, currency, content_name: productTitle, content_ids: [orderId] });
      }
      if (window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: orderId,
          value,
          currency,
          items: [{ item_name: productTitle, price: value, quantity: 1 }],
        });
      }
      if (window.ttq?.track) {
        window.ttq.track("CompletePayment", { value, currency, content_name: productTitle, content_id: orderId });
      }

      if (window.fbq || window.gtag || window.ttq?.track || attempts >= 10) {
        sessionStorage.setItem(key, "1");
        window.clearInterval(interval);
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, [currency, orderId, productTitle, value]);

  return null;
}
