"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { BumpOffer } from "@/lib/settings";
import CheckoutForm from "./CheckoutForm";

type Props = {
  user: { name: string; email: string; phone: string | null } | null;
  bump: BumpOffer | null;
};

export default function CheckoutClient({ user, bump }: Props) {
  const { items, count, subtotalCents, ready } = useCart();
  const [bumpChecked, setBumpChecked] = useState(false);

  const bumpOn = !!bump && bumpChecked;

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">
        جارٍ تحميل السلة…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-3xl">
          🛍️
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-fg">سلتك فاضية</h1>
        <p className="mt-2 text-muted">ضيف منتجات الأول عشان تكمّل الطلب.</p>
        <Link
          href="/#products"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          اتفرّج على المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-brand-300">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-fg">إتمام الطلب</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-fg sm:text-3xl">إتمام الطلب</h1>
      {!user && (
        <p className="mt-1 text-sm text-muted">
          عندك حساب؟{" "}
          <Link href="/login?next=/checkout" className="text-brand-300 hover:underline">
            سجّل دخول
          </Link>{" "}
          عشان بياناتك تتملّى تلقائي.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* الفورم */}
        <CheckoutForm
          user={user}
          bump={bump}
          bumpChecked={bumpOn}
          onBumpChange={setBumpChecked}
        />

        {/* ملخص الطلب */}
        <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 flex items-center justify-between font-bold text-fg">
            ملخص الطلب
            <span className="tnum text-sm font-normal text-muted">
              {count} قطعة
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-fg">
                    {item.name}
                  </p>
                  <p className="tnum text-xs text-muted">
                    {formatPrice(item.priceCents, item.currency)}
                  </p>
                </div>
                <span className="tnum text-sm font-bold text-fg">
                  {formatPrice(item.priceCents, item.currency)}
                </span>
              </li>
            ))}
          </ul>
          {(() => {
            const effSubtotal = subtotalCents + (bumpOn && bump ? bump.bumpCents : 0);
            return (
              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>المجموع الفرعي</span>
                  <span className="tnum">{formatPrice(subtotalCents)}</span>
                </div>
                {bumpOn && bump && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span>🎁 {bump.name}</span>
                    <span className="tnum">{formatPrice(bump.bumpCents)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 text-fg">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="tnum text-lg font-extrabold">
                    {formatPrice(effSubtotal)}
                  </span>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
