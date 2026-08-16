"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerNotes, toggleCustomerBlock } from "@/app/actions/customers";

export function CustomerActions({
  userId,
  blocked,
  notes,
}: {
  userId: string;
  blocked: boolean;
  notes: string;
}) {
  const [notesValue, setNotesValue] = useState(notes);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSaveNotes() {
    startTransition(async () => {
      await updateCustomerNotes(userId, notesValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleToggleBlock() {
    startTransition(async () => {
      await toggleCustomerBlock(userId, !blocked);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-bold text-fg">إعدادات الأدمن</h3>

      {/* ملاحظات */}
      <div>
        <label className="mb-1 block text-xs text-muted">ملاحظات الأدمن</label>
        <textarea
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none"
          placeholder="ملاحظات داخلية على العميل..."
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleSaveNotes}
            disabled={isPending}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "حفظ الملاحظات"}
          </button>
          {saved && <span className="text-sm text-green-300">تم الحفظ</span>}
        </div>
      </div>

      {/* حظر / إلغاء الحظر */}
      <div className="flex items-center gap-3 border-t border-line pt-4">
        <button
          onClick={handleToggleBlock}
          disabled={isPending}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            blocked
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {blocked ? "إلغاء الحظر" : "حظر العميل"}
        </button>
        {blocked && (
          <span className="text-sm text-red-300">
            العميل محظور — لا يستطيع تسجيل الدخول أو الشراء
          </span>
        )}
      </div>
    </section>
  );
}
