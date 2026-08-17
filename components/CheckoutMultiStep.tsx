"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { placeOrderAction, type CheckoutState } from "@/app/actions/checkout";
import type { BumpOffer, PaymentMethod } from "@/lib/settings";
import Breadcrumbs from "./Breadcrumbs";

type Props = {
  user: { name: string; email: string; phone: string | null } | null;
  bump?: BumpOffer | null;
  initialCoupon?: string;
  taxRate?: number;
  paymentMethods: PaymentMethod[];
  paymentNote: string;
};

const STEP_LABELS = ["معلوماتك", "مراجعة الطلب", "الدفع"];

function applyCouponValidation(
  couponCode: string,
  subtotalCents: number,
  productIds: string[],
): Promise<{ valid: boolean; discountCents: number; error?: string }> {
  return fetch(
    `/api/coupon/validate?code=${encodeURIComponent(couponCode.trim())}&subtotal=${subtotalCents}&productIds=${productIds.join(",")}`
  )
    .then((r) => r.json())
    .then((data) => ({
      valid: !!data.valid,
      discountCents: data.discountCents ?? 0,
      error: data.error,
    }))
    .catch(() => ({ valid: false, discountCents: 0, error: "حدث خطأ" }));
}

export default function CheckoutMultiStep({
  user,
  bump,
  initialCoupon,
  taxRate = 0,
  paymentMethods,
  paymentNote,
}: Props) {
  const { items, count, subtotalCents, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const done = useRef(false);

  const [state, formAction, isPending] = useActionState(
    placeOrderAction,
    {} as CheckoutState
  );

  const [bumpChecked, setBumpChecked] = useState(false);
  const [wantAccount, setWantAccount] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCoupon || "");
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; msg: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscountCents, setCouponDiscountCents] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethods[0]?.id || "");

  const bumpOn = !!bump && bumpChecked;
  const bumpCents = bumpOn && bump ? bump.bumpCents : 0;
  const discountedSubtotal = Math.max(0, subtotalCents - couponDiscountCents);
  const preTax = discountedSubtotal + bumpCents;
  const taxCents = taxRate > 0 ? Math.round((preTax * taxRate) / 100) : 0;
  const finalTotal = preTax + taxCents;

  const itemsJson = JSON.stringify(
    items.map((i) => ({ productId: i.productId, qty: 1 }))
  );

  useEffect(() => {
    if (state.ok && state.orderNumber && !done.current) {
      done.current = true;
      try {
        sessionStorage.setItem("just_placed_order", state.orderNumber);
      } catch {}
      clear();
      router.replace(`/orders/${state.orderNumber}`);
    }
  }, [state, clear, router]);

  useEffect(() => {
    if (initialCoupon && subtotalCents > 0) {
      setCouponLoading(true);
      fetch(`/api/coupon/validate?code=${encodeURIComponent(initialCoupon)}&subtotal=${subtotalCents}&productIds=${items.map((i) => i.productId).join(",")}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid && data.discountCents > 0) {
            setCouponDiscountCents(data.discountCents);
            setCouponStatus({ valid: true, msg: `خصم ${formatPrice(data.discountCents)} ✓` });
          } else {
            setCouponDiscountCents(0);
          }
        })
        .catch(() => {})
        .finally(() => setCouponLoading(false));
    }
  }, []);

  if (items.length === 0 && !state.ok) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-3xl">
          🛍️
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-fg">سلتك فاضية</h1>
        <p className="mt-2 text-muted">ضيف منتجات الأول عشان تكمّل الطلب.</p>
        <Link
          href="/cart"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          رجوع للسلة
        </Link>
      </div>
    );
  }

  function getFieldValue(name: string): string {
    const el = formRef.current?.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    return el?.value?.trim() ?? "";
  }

  function validateStep(s: number): boolean {
    if (s === 0) {
      const name = getFieldValue("customerName");
      const phone = getFieldValue("customerPhone");
      const email = getFieldValue("customerEmail");
      if (name.length < 2) return false;
      if (!phone) return false;
      if (!email) return false;
      if (wantAccount) {
        const password = getFieldValue("password");
        if (password.length < 6) return false;
      }
      return true;
    }
    if (s === 2) {
      if (finalTotal > 0) {
        const proof = formRef.current?.elements.namedItem(
          "proof"
        ) as HTMLInputElement | null;
        if (!proof?.files?.length) return false;
      }
      return true;
    }
    return true;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 2));
    }
  }

  function handlePrev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleFinalSubmit() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Breadcrumbs
        items={[
          { label: "سلة التسوق", href: "/cart" },
          { label: "إتمام الطلب" },
        ]}
      />

      <h1 className="text-2xl font-extrabold text-fg sm:text-3xl">
        إتمام الطلب
      </h1>

      {/* مؤشر التقدّم */}
      <nav aria-label="خطوات إتمام الطلب" className="mt-6 flex items-center justify-center">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                role="listitem"
                aria-current={i === step ? "step" : undefined}
                aria-label={`الخطوة ${i + 1}: ${label}`}
                className={`grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-bold transition-colors ${
                  i < step
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : i === step
                      ? "border-brand-500 bg-brand-600 text-white"
                      : "border-line bg-surface text-muted"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${i <= step ? "text-fg" : "text-muted"}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mx-2 mb-6 h-0.5 w-16 sm:w-24 ${i < step ? "bg-emerald-500" : "bg-line"}`}
              />
            )}
          </div>
        ))}
      </nav>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {state.error}
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
      >
        {/* حقول مخفية */}
        <input type="hidden" name="items" value={itemsJson} />
        <input type="hidden" name="paymentMethod" value={selectedMethod} />
        <input type="hidden" name="couponCode" value={couponCode} />
        <input type="hidden" name="taxCents" value={taxCents} />
        <input type="hidden" name="discountCents" value={couponDiscountCents} />

        <div className="flex flex-col gap-6">
          {/* ═══ الخطوة 1 — معلوماتك ═══ */}
          <section
            className={`rounded-2xl border border-line bg-surface p-5 ${step !== 0 ? "hidden" : ""}`}
          >
            <h2 className="mb-4 font-bold text-fg">بياناتك</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="الاسم"
                name="customerName"
                defaultValue={user?.name ?? ""}
                required
                placeholder="اسمك بالكامل"
              />
              <Field
                label="الموبايل"
                name="customerPhone"
                defaultValue={user?.phone ?? ""}
                required
                placeholder="01xxxxxxxxx"
                inputMode="tel"
              />
              <Field
                label="الإيميل (للتوصيل الرقمي)"
                name="customerEmail"
                defaultValue={user?.email ?? ""}
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <label
              className="mt-4 block text-sm text-muted"
              htmlFor="note"
            >
              ملاحظات (اختياري)
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="أي تفاصيل إضافية للطلب"
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            />

            {!user && (
              <div className="mt-4 rounded-xl border border-line bg-bg p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-fg">
                  <input
                    type="checkbox"
                    name="createAccount"
                    checked={wantAccount}
                    onChange={(e) => setWantAccount(e.target.checked)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  اعمل حساب عشان أتابع طلباتي بعدين
                </label>
                {wantAccount && (
                  <div className="mt-3">
                    <Field
                      label="كلمة السر"
                      name="password"
                      type="password"
                      placeholder="6 حروف على الأقل"
                      required
                    />
                    <p className="mt-1 text-xs text-muted">
                      هنستخدم نفس الإيميل والموبايل فوق لحسابك.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ═══ الخطوة 2 — مراجعة الطلب ═══ */}
          <section
            className={`rounded-2xl border border-line bg-surface p-5 ${step !== 1 ? "hidden" : ""}`}
          >
            <h2 className="mb-4 font-bold text-fg">مراجعة الطلب</h2>

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-fg">
                    {item.name}
                  </span>
                  <span className="tnum text-fg">
                    {formatPrice(
                      item.priceCents,
                      item.currency
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {/* كوبون الخصم */}
            <div className="mt-4 rounded-xl border border-line bg-bg p-4">
              <label className="mb-2 block text-sm font-medium text-fg">كود الخصم</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); setCouponDiscountCents(0); }}
                  placeholder="اكتب الكود هنا"
                  disabled={couponLoading}
                  className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!couponCode.trim()) return;
                    setCouponLoading(true);
                    const result = await applyCouponValidation(couponCode, subtotalCents, items.map((i) => i.productId));
                    if (result.valid && result.discountCents > 0) {
                      setCouponDiscountCents(result.discountCents);
                      setCouponStatus({ valid: true, msg: `خصم ${formatPrice(result.discountCents)} ✓` });
                    } else {
                      setCouponDiscountCents(0);
                      setCouponStatus({ valid: false, msg: result.error || "الكود غير صالح" });
                    }
                    setCouponLoading(false);
                  }}
                  disabled={couponLoading || !couponCode.trim()}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
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

            {/* العرض الإضافي (Order Bump) */}
            {bump && (
              <label
                className={`relative mt-4 flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-all ${
                  bumpChecked
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-amber-500/60 bg-amber-500/5 hover:border-amber-400"
                }`}
              >
                <input
                  type="checkbox"
                  name="bump"
                  value="1"
                  checked={bumpChecked}
                  onChange={(e) => setBumpChecked(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-emerald-500"
                />
                {bump.image && (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <Image
                      src={bump.image}
                      alt={`صورة ${bump.name}`}
                      unoptimized
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-fg">
                    {bump.headline}
                  </p>
                  {bump.desc && (
                    <p className="mt-0.5 text-xs text-muted">
                      {bump.desc}
                    </p>
                  )}
                  <p className="tnum mt-1 text-sm">
                    <span className="font-extrabold text-emerald-400">
                      {formatPrice(bump.bumpCents)}
                    </span>
                    {bump.bumpCents < bump.originalCents && (
                      <>
                        <span className="mx-2 text-muted line-through">
                          {formatPrice(bump.originalCents)}
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          وفّر{" "}
                          {Math.round(
                            (1 -
                              bump.bumpCents /
                                bump.originalCents) *
                              100
                          )}
                          %
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {bumpChecked && (
                  <span
                    className="absolute left-3 top-3 text-lg"
                    aria-hidden="true"
                  >
                    ✅
                  </span>
                )}
              </label>
            )}

            {/* الإجمالي */}
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>المنتجات</span>
                <span className="tnum">{formatPrice(subtotalCents)}</span>
              </div>
              {bumpCents > 0 && (
                <div className="flex items-center justify-between text-muted">
                  <span>العرض الإضافي</span>
                  <span className="tnum">{formatPrice(bumpCents)}</span>
                </div>
              )}
              {couponDiscountCents > 0 && (
                <div className="flex items-center justify-between text-green-400">
                  <span>خصم كوبون ({couponCode})</span>
                  <span className="tnum">-{formatPrice(couponDiscountCents)}</span>
                </div>
              )}
              {taxCents > 0 && (
                <div className="flex items-center justify-between text-muted">
                  <span>الضريبة ({taxRate}%)</span>
                  <span className="tnum">{formatPrice(taxCents)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-fg">
                <span className="font-semibold">الإجمالي</span>
                <span className="tnum text-xl font-extrabold">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>
          </section>

          {/* ═══ الخطوة 3 — الدفع ═══ */}
          <section
            className={`rounded-2xl border border-line bg-surface p-5 ${step !== 2 ? "hidden" : ""}`}
          >
            <h2 className="mb-4 font-bold text-fg">طريقة الدفع</h2>

            {paymentMethods.length === 0 ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center">
                <p className="text-sm text-amber-300">مفيش طرق دفع مضافة. تواصل مع الإدارة.</p>
              </div>
            ) : (
              <>
                {/* Method selector */}
                <div className="flex flex-col gap-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                        selectedMethod === method.id
                          ? "border-brand-500/40 bg-brand-600/10"
                          : "border-line bg-bg hover:border-brand-500/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethodId"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-fg">{method.name}</p>
                        <ul className="tnum mt-1 space-y-0.5 text-sm text-muted">
                          {method.fields.map((field, fi) => (
                            <li key={fi}>
                              {field.label}: <span className="text-fg">{field.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span
                        className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                          selectedMethod === method.id
                            ? "border-brand-500 bg-brand-500"
                            : "border-muted/40"
                        }`}
                      />
                    </label>
                  ))}
                </div>

                {/* Payment note */}
                {paymentNote && (
                  <p className="mt-3 text-xs text-muted">{paymentNote}</p>
                )}

                {/* Proof upload — مطلوب فقط لو الإجمالي > 0 */}
                {finalTotal > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-fg" htmlFor="proof">
                    صورة إثبات التحويل *
                  </label>
                  <input
                    id="proof"
                    name="proof"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-700"
                  />
                </div>
                )}
              </>
            )}
          </section>

          {/* أزرار التنقّل */}
          <div className="flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-fg transition-colors hover:bg-surface-2"
              >
                رجوع
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95"
              >
                التالي
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isPending || items.length === 0}
                className="rounded-xl bg-brand-gradient px-6 py-3.5 font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "جاري تأكيد الطلب…" : "أكّد الطلب"}
              </button>
            )}
          </div>

          {step === 2 && (
            <p className="text-center text-xs text-muted">
              بتأكيد الطلب هيتسجّل عندنا وتقدر تتابع حالته برقمه.
            </p>
          )}
        </div>

        {/* ملخص الطلب — جانبي ثابت */}
        <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 flex items-center justify-between font-bold text-fg">
            ملخص الطلب
            <span className="tnum text-sm font-normal text-muted">
              {count} قطعة
            </span>
          </h2>

          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <Image
                    src={item.image}
                    alt={`صورة ${item.name}`}
                    unoptimized
                    width={48}
                    height={48}
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
                  {formatPrice(
                    item.priceCents,
                    item.currency
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>المجموع الفرعي</span>
              <span className="tnum">{formatPrice(subtotalCents)}</span>
            </div>
            {bumpOn && bump && (
              <div className="flex items-center justify-between text-emerald-300">
                <span>🎁 {bump.name}</span>
                <span className="tnum">
                  {formatPrice(bump.bumpCents)}
                </span>
              </div>
            )}
            {couponDiscountCents > 0 && (
              <div className="flex items-center justify-between text-green-400">
                <span>خصم كوبون ({couponCode})</span>
                <span className="tnum">-{formatPrice(couponDiscountCents)}</span>
              </div>
            )}
            {taxCents > 0 && (
              <div className="flex items-center justify-between text-muted">
                <span>الضريبة ({taxRate}%)</span>
                <span className="tnum">{formatPrice(taxCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 text-fg">
              <span className="font-semibold">الإجمالي</span>
              <span className="tnum text-lg font-extrabold">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

            {/* كوبون الخصم */}
          <div className="mt-4 border-t border-line pt-4">
            <label
              className="block text-sm text-muted"
              htmlFor="coupon-sidebar"
            >
              كود الخصم
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="coupon-sidebar"
                type="text"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); }}
                placeholder="ادخل الكود هنا"
                className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!couponCode.trim()) return;
                  setCouponLoading(true);
                  const result = await applyCouponValidation(couponCode, subtotalCents, items.map((i) => i.productId));
                  if (result.valid && result.discountCents > 0) {
                    setCouponDiscountCents(result.discountCents);
                    setCouponStatus({ valid: true, msg: `خصم ${formatPrice(result.discountCents)} ✓` });
                  } else if (result.valid) {
                    setCouponDiscountCents(0);
                    setCouponStatus({ valid: true, msg: "الكود مُطبق (بدون خصم)" });
                  } else {
                    setCouponDiscountCents(0);
                    setCouponStatus({ valid: false, msg: result.error || "الكود غير صالح" });
                  }
                  setCouponLoading(false);
                }}
                disabled={couponLoading || !couponCode.trim()}
                className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {couponLoading ? "…" : "تطبيق"}
              </button>
            </div>
            {couponStatus && (
              <p className={`mt-1.5 text-xs font-semibold ${couponStatus.valid ? "text-green-400" : "text-red-400"}`}>
                {couponStatus.msg}
              </p>
            )}
          </div>


        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "tel" | "text" | "email";
}) {
  return (
    <div>
      <label className="block text-sm text-muted" htmlFor={name}>
        {label}{" "}
        {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
      />
    </div>
  );
}
