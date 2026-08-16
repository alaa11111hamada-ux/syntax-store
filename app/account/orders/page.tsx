import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import OrdersPageClient from "@/components/OrdersPageClient";

export const metadata: Metadata = { title: "طلباتي — حسابي" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

const STATUS_TABS = [
  { key: "", label: "الكل" },
  { key: "pending", label: "قيد المراجعة" },
  { key: "confirmed", label: "مؤكّد" },
  { key: "delivered", label: "تم التسليم" },
];

export default async function OrdersPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");

  const { status, page } = await searchParams;
  const active = status && ["pending", "confirmed", "delivered", "cancelled", "returned"].includes(status) ? status : "";
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const perPage = 10;

  const where: Prisma.OrderWhereInput = { userId: user.id };
  if (active) where.status = active;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const clientOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    totalCents: o.totalCents || o.subtotalCents,
    itemsCount: o.items.length,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const isActive = t.key === active;
          const params = new URLSearchParams();
          if (t.key) params.set("status", t.key);
          return (
            <Link
              key={t.key || "all"}
              href={`/account/orders${params.toString() ? `?${params.toString()}` : ""}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand-500 bg-brand-600/15 text-brand-200"
                  : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <OrdersPageClient initialOrders={clientOrders} baseUrl="/account/orders" />
    </div>
  );
}
