"use client";

import { useState, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";

const STATUS_STEPS = [
  { key: "pending", label: "قيد المراجعة", description: "تم استلام طلبك ونراجعه الآن." },
  { key: "confirmed", label: "مؤكّد", description: "تم تأكيد الطلب والدفع بنجاح." },
  { key: "delivered", label: "تم التسليم", description: "تم تسليم طلبك بنجاح. استمتع بالمنتج!" },
];

type OrderItem = {
  name: string;
  priceCents: number;
  qty: number;
};

type OrderData = {
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  totalCents: number;
  items: OrderItem[];
};

function getStepIndex(status: string): number {
  switch (status) {
    case "pending": return 0;
    case "confirmed": return 1;
    case "delivered": return 2;
    case "cancelled": return -1;
    case "returned": return -1;
    default: return 0;
  }
}

export default function EnhancedTrackForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchOrder(orderNumber: string) {
    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(orderNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          if (data.order.status !== lastStatus) {
            setLastStatus(data.order.status);
          }
        }
      }
    } catch {}
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setLastStatus(data.order.status);
        } else {
          setError("لم نجد طلب بهذا الرقم.");
        }
      } else {
        setError("حدث خطأ أثناء البحث. حاول مرة تانية.");
      }
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة تانية.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (order) {
      intervalRef.current = setInterval(() => {
        fetchOrder(order.orderNumber);
      }, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [order?.orderNumber]);

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="رقم الطلب (SYX-...)"
          aria-label="رقم الطلب"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-fg outline-none focus:border-brand-500 sm:text-right"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "جاري البحث..." : "تتبّع"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-fg">طلب رقم: {order.orderNumber}</span>
            <span className="text-xs text-muted">
              {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="mt-6">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep || (order.status === "delivered" && idx <= 2);
              const isCurrent = idx === currentStep && order.status !== "cancelled" && order.status !== "returned";
              const isCancelled = order.status === "cancelled" || order.status === "returned";

              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold ${
                        isCancelled
                          ? "border-red-500 bg-red-500/20 text-red-400"
                          : isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isCurrent
                              ? "border-brand-500 bg-brand-600 text-white"
                              : "border-line bg-surface text-muted"
                      }`}
                    >
                      {isCompleted ? "✓" : isCancelled ? "✕" : idx + 1}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-8 w-0.5 ${
                          isCompleted ? "bg-emerald-500" : "bg-line"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? "text-brand-400"
                          : isCompleted
                            ? "text-emerald-400"
                            : isCancelled
                              ? "text-red-400"
                              : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="mt-1 text-xs text-muted">{step.description}</p>
                    )}
                    {isCancelled && idx === 0 && (
                      <p className="mt-1 text-xs text-red-300">
                        {order.status === "cancelled" ? "تم إلغاء الطلب." : "تم إرجاع الطلب."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <h3 className="mb-3 text-sm font-bold text-fg">تفاصيل الطلب</h3>
            <ul className="flex flex-col gap-2">
              {order.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-fg">
                    {item.name} × {item.qty}
                  </span>
                  <span className="tnum text-fg">
                    {formatPrice(item.priceCents * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-muted">الإجمالي</span>
              <span className="tnum text-lg font-extrabold text-fg">
                {formatPrice(order.totalCents)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
