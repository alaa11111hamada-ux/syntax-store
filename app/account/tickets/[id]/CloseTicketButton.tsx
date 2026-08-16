"use client";

import { useTransition } from "react";
import { closeTicketAction } from "@/app/actions/tickets";

export function CloseTicketButton({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await closeTicketAction(ticketId);
        })
      }
      disabled={pending}
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
    >
      {pending ? "جاري الإغلاق..." : "إغلاق التذكرة"}
    </button>
  );
}
