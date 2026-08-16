"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartDrawer() {
  const {
    items,
    count,
    subtotalCents,
    isOpen,
    closeCart,
    remove,
    clear,
  } = useCart();

  // قفل تمرير الصفحة + إغلاق بـ Esc أثناء فتح الدرج
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      {/* الخلفية المعتمة */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* اللوحة الجانبية (تنزلق من اليمين في RTL) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سلة التسوق"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-bg shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* الهيدر */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-fg">
            🛒 سلة التسوق
            {count > 0 && (
              <span className="tnum rounded-full bg-surface px-2 py-0.5 text-sm font-bold text-brand-300">
                {count}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            ✕
          </button>
        </div>

        {/* المحتوى */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-3xl">
              🛍️
            </div>
            <p className="text-muted">سلتك فاضية لسه.</p>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-xl bg-brand-gradient px-6 py-2.5 font-semibold text-white transition-opacity hover:opacity-95"
            >
              ابدأ التسوّق
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex gap-3 rounded-2xl border border-line bg-surface p-3"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                    >
                      <Image
                        src={item.image}
                        alt={`صورة ${item.name}`}
                        unoptimized
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-bold text-fg hover:text-brand-300"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          aria-label={`حذف ${item.name}`}
                          className="shrink-0 text-muted transition-colors hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <span className={`mt-1 text-sm ${item.priceCents === 0 ? "text-green-400 font-semibold" : "tnum text-muted"}`}>
                        {item.priceCents === 0 ? "مجاني" : formatPrice(item.priceCents, item.currency)}
                      </span>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        {/* السعر */}
                        <span className={`text-sm font-extrabold ${item.priceCents === 0 ? "text-green-400" : "tnum text-fg"}`}>
                          {item.priceCents === 0 ? "مجاني" : formatPrice(item.priceCents, item.currency)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={clear}
                className="mt-4 text-sm text-muted underline-offset-4 transition-colors hover:text-red-400 hover:underline"
              >
                تفريغ السلة
              </button>
            </div>

            {/* الفوتر: الإجمالي + إتمام الطلب */}
            <div className="border-t border-line bg-surface/40 px-5 py-4">
              <div className="flex items-center justify-between text-fg">
                <span className="text-muted">الإجمالي المبدئي</span>
                <span className="tnum text-xl font-extrabold">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                الشحن (لو وجد) بيتحدّد في خطوة الدفع.
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 block w-full rounded-xl bg-brand-gradient px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95"
              >
                إتمام الطلب ←
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function TrashIcon() {
  return (
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
  );
}
