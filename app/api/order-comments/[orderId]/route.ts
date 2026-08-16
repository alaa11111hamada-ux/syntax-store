import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = (order.userId && user.id === order.userId) || user.role === "admin";
  if (!isOwnerOrAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comments = await prisma.orderComment.findMany({
    where: { orderId, visible: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      visible: c.visible,
      createdAt: c.createdAt.toISOString(),
      userName: c.user?.name ?? "المتجر",
    })),
  });
}
