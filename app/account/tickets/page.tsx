import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TicketsList from "./TicketsList";

export const metadata: Metadata = { title: "تذاكر الدعم — حسابي" };
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/tickets");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-fg">تذاكر الدعم</h1>
      </div>

      <TicketsList tickets={tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        category: t.category,
        createdAt: t.createdAt.toISOString(),
      }))} />
    </div>
  );
}
