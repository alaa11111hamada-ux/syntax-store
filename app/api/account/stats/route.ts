import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = await prisma.order.aggregate({
    where: { userId: user.id, status: { in: ["confirmed", "delivered"] } },
    _sum: { totalCents: true },
    _count: { id: true },
  });

  return NextResponse.json({
    totalOrders: stats._count.id,
    totalSpent: stats._sum.totalCents ?? 0,
  });
}
