import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  // استعلام واحد لكل الـ 7 أيام بدلاً من 7 استعلامات
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { in: ["confirmed", "delivered"] },
    },
    select: { totalCents: true, createdAt: true },
  });

  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayOrders = orders.filter((o) => {
      const oDate = o.createdAt.toISOString().slice(0, 10);
      return oDate === dateStr;
    });

    days.push({
      date: dateStr,
      revenue: dayOrders.reduce((s, o) => s + o.totalCents, 0) / 100,
      orders: dayOrders.length,
    });
  }

  return NextResponse.json(days);
}
