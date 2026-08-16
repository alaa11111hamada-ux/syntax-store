import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  if (!isAdmin && ticket.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      userId: true,
      attachment: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      userId: m.userId,
      isSystem: m.userId === null,
      attachment: m.attachment,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
