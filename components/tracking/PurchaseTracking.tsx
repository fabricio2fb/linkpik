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

    const fired = { fbq: false, gtag: false, ttq: false };
    let attempts = 0;

    const interval = window.setInterval(() => {
      attempts += 1;

      if (!fired.fbq && window.fbq) {
        window.fbq("track", "Purchase", { value, currency, content_name: productTitle, content_ids: [orderId] });
        fired.fbq = true;
      }

      if (!fired.gtag && window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: orderId,
          value,
          currency,
          items: [{ item_name: productTitle, price: value, quantity: 1 }],
        });
        fired.gtag = true;
      }

      if (!fired.ttq && window.ttq?.track) {
        window.ttq.track("CompletePayment", { value, currency, content_name: productTitle, content_id: orderId });
        fired.ttq = true;
      }

      if ((fired.fbq && fired.gtag && fired.ttq) || attempts >= 10) {
        sessionStorage.setItem(key, "1");
        window.clearInterval(interval);
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, [currency, orderId, productTitle, value]);

  return null;
}
