"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { replyTicketAdminAction, updateTicketStatusAction, updateTicketPriorityAction, type AdminTicketState } from "@/app/actions/tickets-admin";
import { closeTicketAction } from "@/app/actions/tickets";

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  messages: { id: string; content: string; userId: string | null; isSystem: boolean; attachment?: string | null; createdAt: string }[];
};

const STATUS_MAP: Record<string, string> = { open: "مفتوحة", replied: "تم الرد", closed: "مغلقة" };
const PRIORITY_MAP: Record<string, string> = { low: "منخفضة", normal: "عادية", high: "مرتفعة", urgent: "عاجلة" };

export default function AdminTicketDetail({ ticket: initialTicket }: { ticket: Ticket }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [replyState, replyAction, replyPending] = useActionState(replyTicketAdminAction, {} as AdminTicketState);
  const [pendingStatus, startStatus] = useTransition();
  const [pendingPriority, startPriority] = useTransition();
  const [pendingClose, startClose] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(initialTicket.messages.length);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setTicket((prev) => ({ ...prev, messages: data.messages }));
      }
    } catch {}
  }, [ticket.id]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (ticket.messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = ticket.messages.length;
  }, [ticket.messages.length]);

  useEffect(() => {
    fetchMessages();
  }, [replyState.ok, fetchMessages]);

  function changeStatus(s: string) {
    startStatus(async () => {
      await updateTicketStatusAction(ticket.id, s);
      setTicket((prev) => ({ ...prev, status: s }));
    });
  }
  function changePriority(p: string) {
    startPriority(async () => {
      await updateTicketPriorityAction(ticket.id, p);
      setTicket((prev) => ({ ...prev, priority: p }));
    });
  }
  function closeTicket() {
    startClose(async () => {
      await closeTicketAction(ticket.id);
      setTicket((prev) => ({ ...prev, status: "closed" }));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/tickets" className="text-sm text-brand-300 hover:underline">
            ← كل التذاكر
          </Link>
          <h2 className="mt-1 tnum text-xl font-extrabold text-fg">
            {ticket.ticketNumber}
          </h2>
          <p className="text-sm text-muted">{ticket.subject}</p>
        </div>
        {ticket.status !== "closed" && (
          <button
            onClick={closeTicket}
            disabled={pendingClose}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {pendingClose ? "جاري الإغلاق..." : "إغلاق التذكرة"}
          </button>
        )}
        {ticket.status === "closed" && (
          <span className="text-sm font-semibold text-muted">مغلقة</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* معلومات العميل */}
        <aside className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold text-fg">العميل</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>الاسم: <span className="text-fg">{ticket.user.name}</span></li>
            <li>الإيميل: <span className="text-fg">{ticket.user.email}</span></li>
            {ticket.user.phone && <li>الموبايل: <span className="tnum text-fg">{ticket.user.phone}</span></li>}
          </ul>

          <hr className="my-4 border-line" />

          {/* تغيير الحالة */}
          <h3 className="mb-2 font-bold text-fg">الحالة</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <button
                key={k}
                onClick={() => changeStatus(k)}
                disabled={pendingStatus || k === ticket.status}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  k === ticket.status
                    ? "border-brand-500 bg-brand-600/20 text-brand-200"
                    : "border-line bg-bg text-fg hover:border-brand-600/50"
                } disabled:opacity-50`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* تغيير الأولوية */}
          <h3 className="mb-2 mt-4 font-bold text-fg">الأولوية</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRIORITY_MAP).map(([k, v]) => (
              <button
                key={k}
                onClick={() => changePriority(k)}
                disabled={pendingPriority || k === ticket.priority}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  k === ticket.priority
                    ? "border-brand-500 bg-brand-600/20 text-brand-200"
                    : "border-line bg-bg text-fg hover:border-brand-600/50"
                } disabled:opacity-50`}
              >
                {v}
              </button>
            ))}
          </div>
        </aside>

        {/* المحادثة */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 max-h-[500px] overflow-y-auto">
            {ticket.messages.map((m) => (
              <div key={m.id} className={`flex ${m.userId ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.isSystem
                      ? "bg-brand-600/20 text-fg"
                      : "bg-surface-2 text-fg"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  {m.attachment && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.attachment}
                        alt="مرفق"
                        className="max-h-48 rounded-lg border border-line cursor-pointer"
                        onClick={() => window.open(m.attachment!, "_blank")}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {m.isSystem ? "أدمن" : ticket.user.name} ·{" "}
                    {new Date(m.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* رد الأدمن */}
          {ticket.status !== "closed" && (
            <form action={replyAction} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea
                name="content"
                rows={3}
                required
                placeholder="اكتب ردك..."
                className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  صورة
                  <input
                    type="file"
                    name="attachment"
                    ref={fileRef}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
              {replyState.error && <p className="text-sm text-red-400">{replyState.error}</p>}
              {replyState.ok && <p className="text-sm text-green-400">تم إرسال الرد.</p>}
              <button
                type="submit"
                disabled={replyPending}
                className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {replyPending ? "جاري الإرسال..." : "إرسال الرد"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
