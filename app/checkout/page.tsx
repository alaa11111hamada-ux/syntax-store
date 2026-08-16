import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getBumpOffer, getActivePaymentMethods, getSettings } from "@/lib/settings";
import CheckoutMultiStep from "@/components/CheckoutMultiStep";

export const metadata: Metadata = { title: "إتمام الطلب" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const [user, bump, params, paymentMethods, settings] = await Promise.all([
    getCurrentUser(),
    getBumpOffer(),
    searchParams,
    getActivePaymentMethods(),
    getSettings(),
  ]);
  const taxRate = settings.tax_enabled === "1" && settings.tax_rate
    ? Number(settings.tax_rate.replace(/,/g, "")) || 0
    : 0;
  return (
    <CheckoutMultiStep
      user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
      bump={bump}
      initialCoupon={params.coupon || ""}
      taxRate={taxRate}
      paymentMethods={paymentMethods}
      paymentNote={settings.payment_note || ""}
    />
  );
}
