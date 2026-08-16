"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { ShoppingBag } from "lucide-react";
import type { ProductView } from "@/lib/products";

export default function CartPage() {
  const { items, count, subtotalCents, ready, remove, clear } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; msg: string; discountCents?: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [suggested, setSuggested] = useState<ProductView[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (items.length > 0) {
      const ids = items.map((i) => i.productId);
      fetch(`/api/products?related=${ids.join(",")}`)
        .then((r) => r.json())
        .then((data) => setSuggested((data.products ?? []).slice(0, 3)))
        .catch(() => {});
    }
  }, [items.map((i) => i.productId).join(",")]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        جاري التحميل...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface">
          <ShoppingBag className="h-8 w-8 text-muted" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-fg">سلتك فاضية</h1>
        <p className="mt-2 text-muted">مفيش منتجات في سلتك حالياً.</p>
        <Link
          href="/#products"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          اتفرّج على المنتجات
        </Link>
      </div>
    );
  }

  const totalSavings = items.reduce((acc, item) => {
    if (item.compareAtCents && item.compareAtCents > item.priceCents) {
      return acc + (item.compareAtCents - item.priceCents);
    }
    return acc;
  }, 0);

  const proceedToCheckout = () => {
    const params = new URLSearchParams();
    const couponCode = appliedCoupon?.code || coupon.trim();
    if (couponCode) params.set("coupon", couponCode);
    router.push(`/checkout${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs items={[{ label: "السلة" }]} />

      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-fg sm:text-3xl">
            سلة المشتريات
          </h1>
        {showClearConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">تأكيد التفريغ؟</span>
            <button
              type="button"
              onClick={() => { clear(); setShowClearConfirm(false); }}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/30"
            >
              نعم، افرغ
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-surface-2"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-muted transition-colors hover:text-red-400"
          >
            تفريغ السلة
          </button>
        )}
      </div>

      {totalSavings > 0 && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-2.5 text-sm font-semibold text-green-300">
          وفّرت {formatPrice(totalSavings)} من الأسعار الأصلية
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* عناصر السلة */}
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
            >
              <Link
                href={`/products/${item.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-1 font-semibold text-fg hover:text-brand-300"
                >
                  {item.name}
                </Link>
                <p className="tnum mt-1 text-sm text-muted">
                  {formatPrice(item.priceCents, item.currency)}
                </p>
              </div>

              {/* السعر */}
              <span className="tnum hidden text-sm font-extrabold text-fg sm:block">
                {formatPrice(item.priceCents, item.currency)}
              </span>

              {/* حذف */}
              <button
                type="button"
                onClick={() => remove(item.productId)}
                aria-label={`حذف ${item.name}`}
                className="shrink-0 text-muted transition-colors hover:text-red-400"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* ملخص الطلب */}
        <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 flex items-center justify-between font-bold text-fg">
            ملخص الطلب
            <span className="tnum text-sm font-normal text-muted">
              {count} {count === 1 ? "منتج" : "منتجات"}
            </span>
          </h2>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>المجموع الفرعي</span>
              <span className="tnum">{formatPrice(subtotalCents)}</span>
            </div>
            {appliedCoupon && appliedCoupon.discountCents > 0 && (
              <div className="flex items-center justify-between text-green-400">
                <span>خصم ({appliedCoupon.code})</span>
                <span className="tnum">-{formatPrice(appliedCoupon.discountCents)}</span>
              </div>
            )}
          </div>

          {/* كوبون الخصم */}
          <div className="mt-4 border-t border-line pt-4">
            <label
              className="block text-sm text-muted"
              htmlFor="coupon-cart"
            >
              كود الخصم
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="coupon-cart"
                type="text"
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value); setCouponStatus(null); setAppliedCoupon(null); }}
                placeholder="اكتب الكود هنا"
                disabled={!!appliedCoupon}
                className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!coupon.trim()) return;
                  setCouponLoading(true);
                  try {
                    const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(coupon.trim())}&subtotal=${subtotalCents}`);
                    const data = await res.json();
                    if (data.valid) {
                      const disc = data.discountCents ?? 0;
                      setAppliedCoupon({ code: coupon.trim(), discountCents: disc });
                      setCouponStatus({ valid: true, msg: `خصم ${disc > 0 ? formatPrice(disc) : data.discountValue + "%"} ✓`, discountCents: disc });
                    } else {
                      setAppliedCoupon(null);
                      setCouponStatus({ valid: false, msg: data.error || "الكود غير صالح" });
                    }
                  } catch {
                    setAppliedCoupon(null);
                    setCouponStatus({ valid: false, msg: "حدث خطأ" });
                  }
                  setCouponLoading(false);
                }}
                disabled={couponLoading || !coupon.trim()}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {couponLoading ? "…" : "تطبيق"}
              </button>
            </div>
            {couponStatus && (
              <p className={`mt-2 text-xs font-semibold ${couponStatus.valid ? "text-green-400" : "text-red-400"}`}>
                {couponStatus.msg}
              </p>
            )}
          </div>

          {/* الإجمالي */}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-fg">
            <span className="font-semibold">الإجمالي</span>
            <span className="tnum text-xl font-extrabold">
              {formatPrice(Math.max(0, subtotalCents - (appliedCoupon?.discountCents ?? 0)))}
            </span>
          </div>

          <button
            type="button"
            onClick={proceedToCheckout}
            className="mt-4 w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95"
          >
            إتمام الطلب
          </button>

          <Link
            href="/#products"
            className="mt-3 block text-center text-sm text-brand-300 hover:underline"
          >
            متابعة التسوق
          </Link>
        </aside>
      </div>

      {/* منتجات مقترحة */}
      {suggested.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-extrabold text-fg">منتجات مقترحة</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
