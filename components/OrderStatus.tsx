"use client";

import { STATUS_FLOW, STATUS_LABELS, statusLabel, type OrderStatus } from "@/lib/order-constants";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    confirmed: "bg-blue-500/15 text-blue-300 border-blue-500/40",
    delivered: "bg-green-500/15 text-green-300 border-green-500/40",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/40",
    returned: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${
        styles[status] ?? "border-line bg-surface text-muted"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function OrderTimeline({ status }: { status: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (status === "cancelled") {
    return (
      <div
        className={`rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        الطلب ده اتلغى. لو فيه استفسار تواصل معانا.
      </div>
    );
  }

  if (status === "returned") {
    return (
      <div
        className={`rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm text-purple-300 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        الطلب ده اترجّع وفق سياسة الاسترجاع، والمبلغ بيتردّ حسب المدة المذكورة فيها.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(status as OrderStatus);

  return (
    <div className="flex items-start">
      {STATUS_FLOW.map((step, i) => {
        const reached = i <= currentIndex;
        const isLast = i === STATUS_FLOW.length - 1;
        return (
          <div key={step} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-500 ${
                  reached
                    ? "border-brand-500 bg-brand-600 text-white shadow-[0_0_12px_rgba(29,78,216,0.4)]"
                    : "border-line bg-surface text-muted"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {reached ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`mt-1 text-center text-xs transition-all duration-400 ${
                  reached ? "font-semibold text-fg" : "text-muted"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className="mx-0 mt-[17px] h-0.5 flex-1 transition-all duration-500"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className={`h-full ${i < currentIndex ? "bg-brand-500" : "bg-line"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
