"use client";

import { useState } from "react";
import { useCompare } from "@/lib/compare";

export default function CompareButton({ productId }: { productId: string }) {
  const { has, toggle, items, ready } = useCompare();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  if (!ready) return null;

  const isCompared = has(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isCompared && items.length >= 3) {
      setToastMsg("حد أقصى 3 منتجات للمقارنة");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
      return;
    }
    toggle(productId);
    setToastMsg(isCompared ? "تمت الإزالة من المقارنة" : "تمت الإضافة للمقارنة");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`absolute top-3 right-3 z-10 rounded-full p-2 backdrop-blur-sm transition-colors ${
          isCompared
            ? "bg-brand-600 text-white"
            : "bg-black/40 text-white hover:bg-black/60"
        }`}
        aria-label={isCompared ? "إزالة من المقارنة" : "إضافة للمقارنة"}
        title="إضافة للمقارنة"
      >
        {isCompared ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
      {showToast && (
        <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {toastMsg}
        </div>
      )}
    </>
  );
}
