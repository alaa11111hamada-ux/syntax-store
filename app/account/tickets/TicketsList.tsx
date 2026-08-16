"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createTicketAction, type TicketState } from "@/app/actions/tickets";

const STATUS_MAP: Record<string, string> = {
  open: "مفتوحة",
  replied: "تم الرد",
  closed: "مغلقة",
};

const CATEGORY_MAP: Record<string, string> = {
  general: "عام",
  order: "طلب",
  payment: "دفع",
  technical: "تقني",
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  category: string;
  createdAt: string;
};

export default function TicketsList({ tickets }: { tickets: Ticket[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [state, action, pending] = useActionState(createTicketAction, {} as TicketState);

  const filtered = filter ? tickets.filter((t) => t.status === filter) : tickets;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          {showCreate ? "إلغاء" : "تذكرة جديدة"}
        </button>
        {["", "open", "replied", "closed"].map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f
                ? "border-brand-500 bg-brand-600/15 text-brand-200"
                : "border-line bg-surface text-muted hover:text-fg"
            }`}
          >
            {f ? STATUS_MAP[f] : "الكل"}
          </button>
        ))}
      </div>

      {/* نموذج إنشاء تذكرة */}
      {showCreate && (
        <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-bold text-fg">تذكرة جديدة</h3>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">الموضوع</label>
            <input
              type="text"
              name="subject"
              required
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">التصنيف</label>
            <select
              name="category"
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
            >
              <option value="general">عام</option>
              <option value="order">طلب</option>
              <option value="payment">دفع</option>
              <option value="technical">تقني</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">الرسالة</label>
            <textarea
              name="message"
              rows={4}
              required
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
            />
          </div>

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? "جاري الإرسال..." : "إرسال"}
          </button>
        </form>
      )}

      {/* قائمة التذاكر */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-muted">مفيش تذاكر{filter ? " في الحالة دي" : ""}.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((t) => {
            const statusColor =
              t.status === "open"
                ? "text-green-300"
                : t.status === "replied"
                ? "text-blue-300"
                : "text-muted";
            return (
              <li key={t.id}>
                <Link
                  href={`/account/tickets/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-600/50"
                >
                  <div>
                    <p className="tnum font-bold text-fg">{t.ticketNumber}</p>
                    <p className="text-sm text-muted">{t.subject}</p>
                    <p className="mt-1 text-xs text-muted">
                      {CATEGORY_MAP[t.category] ?? t.category} ·{" "}
                      {new Date(t.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${statusColor}`}>
                    {STATUS_MAP[t.status] ?? t.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
