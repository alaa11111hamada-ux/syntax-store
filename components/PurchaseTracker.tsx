"use client";

import { useEffect } from "react";

/**
 * بيطلق حدث Purchase حقيقي لكل البكسلات المفعّلة — مرة واحدة بس لكل طلب.
 * CheckoutForm بيحط رقم الطلب في sessionStorage بعد النجاح،
 * وصفحة الطلب بترندر المكوّن ده فيتحقق ويطلق الحدث ويمسح العلامة.
 */
type Props = {
  orderNumber: string;
  valueEgp: number; // قيمة الطلب بالجنيه
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
    snaptr?: (...args: unknown[]) => void;
  }
}

export default function PurchaseTracker({ orderNumber, valueEgp }: Props) {
  useEffect(() => {
    const KEY = "just_placed_order";
    try {
      if (sessionStorage.getItem(KEY) !== orderNumber) return;
      sessionStorage.removeItem(KEY); // مرة واحدة بس

      // Meta
      window.fbq?.("track", "Purchase", { value: valueEgp, currency: "EGP" });
      // TikTok
      window.ttq?.track("CompletePayment", {
        value: valueEgp,
        currency: "EGP",
        content_type: "product",
      });
      // GA4
      window.gtag?.("event", "purchase", {
        transaction_id: orderNumber,
        value: valueEgp,
        currency: "EGP",
      });
      // Snap
      window.snaptr?.("track", "PURCHASE", {
        price: valueEgp,
        currency: "EGP",
        transaction_id: orderNumber,
      });
    } catch {}
  }, [orderNumber, valueEgp]);

  return null;
}
