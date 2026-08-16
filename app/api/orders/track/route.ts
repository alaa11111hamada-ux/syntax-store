import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const isOrderNumber = q.toUpperCase().startsWith("SYX-");
  const user = await getCurrentUser();

  const order = await prisma.order.findFirst({
    where: isOrderNumber
      ? { orderNumber: q.toUpperCase() }
      : { customerEmail: { contains: q } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (!order) {
    return NextResponse.json({ order: null });
  }

  if (!user || (user.role !== "admin" && user.role !== "manager" && order.userId !== user.id)) {
    return NextResponse.json({ order: null });
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        name: i.name,
        priceCents: i.priceCents,
        qty: i.qty,
      })),
    },
  });
}
