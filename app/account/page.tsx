import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountDashboard from "@/components/AccountDashboard";

export const metadata: Metadata = { title: "حسابي" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.aggregate({
      where: { userId: user.id, status: { in: ["confirmed", "delivered"] } },
      _sum: { totalCents: true },
      _count: { id: true },
    }),
  ]);

  const initialOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    totalCents: o.totalCents || o.subtotalCents,
    itemsCount: o.items.length,
  }));

  const initialStats = {
    totalOrders: stats._count.id,
    totalSpent: stats._sum.totalCents ?? 0,
  };

  return (
    <AccountDashboard
      userName={user.name}
      userEmail={user.email}
      initialOrders={initialOrders}
      initialStats={initialStats}
    />
  );
}
