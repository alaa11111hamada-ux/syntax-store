"use client";

import { useState } from "react";

type Props = {
  enabled: boolean;
  returnTime: string;
};

export default function MaintenanceToggle({ enabled, returnTime }: Props) {
  const [on, setOn] = useState(enabled);
  const [returnAt, setReturnAt] = useState(returnTime);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance_enabled: on ? "true" : "false",
          maintenance_return: returnAt,
        }),
      });
      if (res.ok) {
        setMsg("تم الحفظ");
        setTimeout(() => setMsg(""), 2000);
      } else {
        setMsg("حدث خطأ");
      }
    } catch {
      setMsg("حدث خطأ");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-fg">وضع الصيانة</h3>
          <p className="mt-1 text-sm text-muted">
            عند التفعيل، جميع الزوار سيرون صفحة الصيانة ما عدا الأدمن.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-amber-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5" />
        </label>
      </div>

      {on && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold text-fg">
            وقت العودة المتوقع
          </label>
          <input
            type="datetime-local"
            value={returnAt}
            onChange={(e) => setReturnAt(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand-gradient px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        {msg && (
          <span className={`text-sm font-semibold ${msg.includes("خطأ") ? "text-red-300" : "text-green-300"}`}>
            {msg}
          </span>
        )}
        <a
          href="/maintenance"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-300 hover:underline"
        >
          معاينة صفحة الصيانة
        </a>
      </div>
    </div>
  );
}
