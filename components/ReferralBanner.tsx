"use client";

import { useState } from "react";

export default function ReferralBanner() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  function apply() {
    if (!code.trim()) return;
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  }

  return (
    <div className="rounded-xl border border-line bg-bg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <span>🎉 عندك كود إحالة؟</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
              placeholder="ادخل كود الإحالة"
              className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-fg text-sm outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={apply}
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95"
            >
              تطبيق
            </button>
          </div>
          {applied && (
            <p className="mt-2 text-xs text-green-400">تم تطبيق الكود بنجاح!</p>
          )}
        </div>
      )}
    </div>
  );
}
