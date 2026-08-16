import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketConversation from "./TicketConversation";

export const metadata: Metadata = { title: "تفاصيل التذكرة — حسابي" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const CATEGORY_MAP: Record<string, string> = {
  general: "عام",
  order: "طلب",
  payment: "دفع",
  technical: "تقني",
};

const STATUS_MAP: Record<string, string> = {
  open: "مفتوحة",
  replied: "تم الرد",
  closed: "مغلقة",
};

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/tickets");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket || ticket.userId !== user.id) notFound();

  const statusColor =
    ticket.status === "open"
      ? "text-green-300"
      : ticket.status === "replied"
      ? "text-blue-300"
      : "text-muted";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/account/tickets" className="text-sm text-brand-300 hover:underline">
            ← كل التذاكر
          </a>
          <h1 className="mt-1 tnum text-xl font-extrabold text-fg">
            {ticket.ticketNumber}
          </h1>
          <p className="text-sm text-muted">{ticket.subject}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-line bg-bg px-3 py-1 text-xs font-semibold text-muted">
            {CATEGORY_MAP[ticket.category] ?? ticket.category}
          </span>
          <span className={`text-sm font-semibold ${statusColor}`}>
            {STATUS_MAP[ticket.status] ?? ticket.status}
          </span>
        </div>
      </div>

      <TicketConversation
        ticketId={ticket.id}
        status={ticket.status}
        messages={ticket.messages.map((m) => ({
          id: m.id,
          content: m.content,
          userId: m.userId,
          isSystem: m.userId === null,
          attachment: m.attachment,
          createdAt: m.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
      />
    </div>
  );
}
