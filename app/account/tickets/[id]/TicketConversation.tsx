"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { replyTicketAction, type TicketState } from "@/app/actions/tickets";

type Message = {
  id: string;
  content: string;
  userId: string | null;
  isSystem: boolean;
  attachment?: string | null;
  createdAt: string;
};

export default function TicketConversation({
  ticketId,
  status,
  messages: initialMessages,
  currentUserId,
}: {
  ticketId: string;
  status: string;
  messages: Message[];
  currentUserId: string;
}) {
  const [state, action, pending] = useActionState(replyTicketAction, {} as TicketState);
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(initialMessages.length);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {}
  }, [ticketId]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    fetchMessages();
  }, [state.ok, fetchMessages]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-muted">لسه مفيش رسائل.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.userId === currentUserId;
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.isSystem
                      ? "border border-line bg-bg text-muted"
                      : isOwn
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
                    {new Date(m.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {status !== "closed" && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <form action={action} className="space-y-3">
            <input type="hidden" name="ticketId" value={ticketId} />
            <textarea
              name="content"
              rows={3}
              required
              placeholder="اكتب ردك..."
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            {state.error && <p className="text-sm text-red-400">{state.error}</p>}
            {state.ok && <p className="text-sm text-green-400">تم إرسال الرد.</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {pending ? "جاري الإرسال..." : "إرسال"}
              </button>
            </div>
          </form>
        </div>
      )}

      {status === "closed" && (
        <div className="rounded-xl border border-line bg-surface p-4 text-center text-sm text-muted">
          التذكرة مغلقة.
        </div>
      )}
    </>
  );
}
