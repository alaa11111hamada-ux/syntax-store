"use client";

import { useState, useTransition } from "react";
import { exportProducts, exportOrders, exportCustomers } from "@/app/actions/backup";

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [isPending, startTransition] = useTransition();
  const [activeExport, setActiveExport] = useState<string | null>(null);

  const handleExport = async (type: "products" | "orders" | "customers") => {
    setActiveExport(type);
    startTransition(async () => {
      try {
        if (type === "products") {
          const data = await exportProducts();
          downloadFile(data, `products-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
        } else if (type === "orders") {
          const data = await exportOrders();
          downloadFile(data, `orders-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
        } else {
          const data = await exportCustomers();
          downloadFile(data, `customers-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
        }
      } catch {
        alert("حدث خطأ أثناء التصدير");
      } finally {
        setActiveExport(null);
      }
    });
  };

  const exports = [
    {
      key: "products" as const,
      label: "المنتجات",
      icon: "📦",
      format: "JSON",
      description: "تصدير جميع المنتجات مع الأسعار والتصنيفات",
    },
    {
      key: "orders" as const,
      label: "الطلبات",
      icon: "🧾",
      format: "JSON",
      description: "تصدير جميع الطلبات مع العناصر والتفاصيل",
    },
    {
      key: "customers" as const,
      label: "العملاء",
      icon: "👥",
      format: "CSV",
      description: "تصدير بيانات العملاء بصيغة جدول",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-extrabold text-fg">💾 النسخ الاحتياطي</h2>
        <p className="text-sm text-muted">تصدير البيانات بصيغ مختلفة.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {exports.map((ex) => (
          <div
            key={ex.key}
            className="rounded-2xl border border-line bg-surface p-5 flex flex-col"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{ex.icon}</span>
              <div>
                <div className="font-bold text-fg">{ex.label}</div>
                <div className="text-xs text-muted">{ex.format}</div>
              </div>
            </div>
            <p className="mb-4 flex-1 text-sm text-muted">{ex.description}</p>
            <button
              onClick={() => handleExport(ex.key)}
              disabled={isPending && activeExport === ex.key}
              className="w-full rounded-xl border border-brand-600/50 bg-brand-600/10 px-4 py-2.5 text-sm font-bold text-brand-300 transition-colors hover:bg-brand-600/20 disabled:opacity-60"
            >
              {isPending && activeExport === ex.key
                ? "جارٍ التصدير..."
                : `تصدير ${ex.label}`}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-3 font-bold text-fg">ملاحظات</h3>
        <ul className="flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-300">•</span>
            المنتجات والطلبات بتتصدّر بصيغة JSON تقدر تفتحها في أي محرر نصوص.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-300">•</span>
            بيانات العملاء بتتصدّر بصيغة CSV تقدر تفتحها في Excel أو Google Sheets.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-300">•</span>
            التصدير بيشمل البيانات الحالية فقط — التحديثات اللي بعد كده مش هتتضاف تلقائياً.
          </li>
        </ul>
      </div>
    </div>
  );
}
