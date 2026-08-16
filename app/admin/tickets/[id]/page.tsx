import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminTicketDetail from "./AdminTicketDetail";

export const metadata: Metadata = { title: "تفاصيل التذكرة — لوحة التحكم" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTicketDetailPage({ params }: Props) {
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!ticket) notFound();

  return (
    <AdminTicketDetail
      ticket={{
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt.toISOString(),
        user: ticket.user,
        messages: ticket.messages.map((m) => ({
          id: m.id,
          content: m.content,
          userId: m.userId,
          isSystem: m.userId === null,
          attachment: m.attachment,
          createdAt: m.createdAt.toISOString(),
        })),
      }}
    />
  );
}
