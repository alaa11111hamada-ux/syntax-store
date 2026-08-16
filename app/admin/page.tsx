import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { statusLabel } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/OrderStatus";
import RevenueChart from "@/components/admin/RevenueChart";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const currentUser = await getCurrentUser();
  const isManager = currentUser?.role === "manager";
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // المدير الفرعي يحتاج فقط حالة الطلبات + آخر الطلبات
  const [statusCounts, recentOrders] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusCounts) byStatus[row.status] = row._count.id;

  // باقي البيانات للأدمن الرئيسي فقط
  type OrderAggResult = { _sum: { totalCents?: number | null; [key: string]: unknown }; _count: { id: number } };
  let totalStats: OrderAggResult = { _sum: { totalCents: 0 }, _count: { id: 0 } };
  let todayStats: OrderAggResult = { _sum: { totalCents: 0 }, _count: { id: 0 } };
  let weekStats: OrderAggResult = { _sum: { totalCents: 0 }, _count: { id: 0 } };
  let monthStats: OrderAggResult = { _sum: { totalCents: 0 }, _count: { id: 0 } };
  let yearStats: OrderAggResult = { _sum: { totalCents: 0 }, _count: { id: 0 } };
  type TopProductByRevenue = {
    name: string;
    _sum: { priceCents: number | null; qty: number | null };
    _count: { id: number };
  };
  type TopProductByOrders = {
    name: string;
    _sum: { qty: number | null };
    _count: { id: number };
  };
  let topProductsByRevenue: TopProductByRevenue[] = [];
  let topProductsByOrders: TopProductByOrders[] = [];
  let totalCustomers = 0;
  let customersWithOrders = 0;
  let newThisWeek = 0;
  let lowStock: { id: string; name: string; downloadCount: number; ordersCount: number }[] = [];

  if (!isManager) {
    const statusFilter = { status: { in: ["confirmed" as const, "delivered" as const] } };

    [totalStats, todayStats, weekStats, monthStats, yearStats, topProductsByRevenue, topProductsByOrders] =
      await Promise.all([
        prisma.order.aggregate({ where: statusFilter, _sum: { totalCents: true }, _count: { id: true } }),
        prisma.order.aggregate({ where: { ...statusFilter, createdAt: { gte: startOfDay } }, _sum: { totalCents: true }, _count: { id: true } }),
        prisma.order.aggregate({ where: { ...statusFilter, createdAt: { gte: startOfWeek } }, _sum: { totalCents: true }, _count: { id: true } }),
        prisma.order.aggregate({ where: { ...statusFilter, createdAt: { gte: startOfMonth } }, _sum: { totalCents: true }, _count: { id: true } }),
        prisma.order.aggregate({ where: { ...statusFilter, createdAt: { gte: startOfYear } }, _sum: { totalCents: true }, _count: { id: true } }),
        prisma.orderItem.groupBy({ by: ["name"], where: { order: statusFilter }, _sum: { priceCents: true, qty: true }, _count: { id: true }, orderBy: { _sum: { priceCents: "desc" } }, take: 5 }),
        prisma.orderItem.groupBy({ by: ["name"], _sum: { qty: true }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
      ]);

    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const [customerAgg, custWithOrders, newCustomers, productsWithDownloads, productOrderCounts] =
      await Promise.all([
        prisma.user.aggregate({ where: { role: "customer" }, _count: { id: true } }),
        prisma.user.count({ where: { role: "customer", orders: { some: {} } } }),
        prisma.user.count({ where: { role: "customer", createdAt: { gte: weekAgo } } }),
        prisma.product.findMany({ select: { id: true, name: true, downloadCount: true }, take: 50 }),
        prisma.orderItem.groupBy({ by: ["productId"], _sum: { qty: true }, where: { productId: { not: null } } }),
      ]);

    totalCustomers = customerAgg._count.id;
    customersWithOrders = custWithOrders;
    newThisWeek = newCustomers;

    const orderCountMap = new Map<string, number>();
    for (const row of productOrderCounts) {
      if (row.productId) orderCountMap.set(row.productId, row._sum.qty ?? 0);
    }
    lowStock = productsWithDownloads
      .map((p) => ({ ...p, ordersCount: orderCountMap.get(p.id) ?? 0 }))
      .filter((p) => p.ordersCount > 0 && p.downloadCount < p.ordersCount * 0.5)
      .slice(0, 5);
  }

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("ar-EG", { month: "short", day: "numeric" }).format(d);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold text-fg">نظرة عامة</h2>

      {/* ملخص الإيرادات —أدمن رئيسي فقط */}
      {!isManager && (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">ملخص الإيرادات</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <RevenueCard label="اليوم" value={todayStats._sum.totalCents ?? 0} />
          <RevenueCard label="هذا الأسبوع" value={weekStats._sum.totalCents ?? 0} />
          <RevenueCard label="هذا الشهر" value={monthStats._sum.totalCents ?? 0} />
          <RevenueCard label="هذا العام" value={yearStats._sum.totalCents ?? 0} />
          <StatCard label="الإجمالي المؤكّد" value={formatPrice(totalStats._sum.totalCents ?? 0)} accent />
        </div>
      </section>
      )}

      {/* عدد الطلبات —أدمن رئيسي فقط */}
      {!isManager && (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">عدد الطلبات</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="اليوم" value={String(todayStats._count.id)} />
          <StatCard label="هذا الأسبوع" value={String(weekStats._count.id)} />
          <StatCard label="هذا الشهر" value={String(monthStats._count.id)} />
          <StatCard label="هذا العام" value={String(yearStats._count.id)} />
          <StatCard label="الإجمالي" value={String(totalStats._count.id)} />
        </div>
      </section>
      )}

      {/* حالة الطلبات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">حالة الطلبات</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStat label={statusLabel("pending")} value={byStatus["pending"] ?? 0} color="text-amber-300" />
          <MiniStat label={statusLabel("confirmed")} value={byStatus["confirmed"] ?? 0} color="text-blue-300" />
          <MiniStat label={statusLabel("delivered")} value={byStatus["delivered"] ?? 0} color="text-green-300" />
          <MiniStat label={statusLabel("cancelled")} value={byStatus["cancelled"] ?? 0} color="text-red-300" />
          <MiniStat label={statusLabel("returned")} value={byStatus["returned"] ?? 0} color="text-purple-300" />
        </div>
      </section>

      {/* إحصائيات العملاء —أدمن رئيسي فقط */}
      {!isManager && (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">إحصائيات العملاء</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="إجمالي العملاء" value={String(totalCustomers)} />
          <StatCard label="جدد هذا الأسبوع" value={String(newThisWeek)} />
          <StatCard label="عملاء نشطون" value={String(customersWithOrders)} />
        </div>
      </section>
      )}

      {/* الرسم البياني —أدمن رئيسي فقط */}
      {!isManager && <RevenueChart />}

      {/* أعلى المنتجات —أدمن رئيسي فقط */}
      {!isManager && (
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-fg">الأكثر إيراداً</h3>
            <Link href="/admin/products/analytics" className="text-sm text-brand-300 hover:underline">
              التفاصيل
            </Link>
          </div>
          {topProductsByRevenue.length === 0 ? (
            <p className="text-sm text-muted">لسه مفيش مبيعات.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {topProductsByRevenue.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <span className="tnum ms-2 text-xs text-muted">#{i + 1}</span>
                    <span className="truncate text-sm font-semibold text-fg">{p.name}</span>
                  </div>
                  <div className="text-left">
                    <p className="tnum text-sm font-bold text-green-300">
                      {formatPrice((p._sum.priceCents ?? 0) * (p._sum.qty ?? 1))}
                    </p>
                    <p className="tnum text-xs text-muted">{p._sum.qty ?? 0} قطعة</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-fg">الأكثر طلباتاً</h3>
            <Link href="/admin/products/analytics" className="text-sm text-brand-300 hover:underline">
              التفاصيل
            </Link>
          </div>
          {topProductsByOrders.length === 0 ? (
            <p className="text-sm text-muted">لسه مفيش مبيعات.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {topProductsByOrders.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <span className="tnum ms-2 text-xs text-muted">#{i + 1}</span>
                    <span className="truncate text-sm font-semibold text-fg">{p.name}</span>
                  </div>
                  <span className="tnum shrink-0 rounded-full border border-line bg-bg px-3 py-1 text-sm font-bold text-fg">
                    {p._sum.qty ?? 0} طلب
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      )}

      {/* تنبيهات المخزون —أدمن رئيسي فقط */}
      {!isManager && lowStock.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="mb-4 font-bold text-amber-300">تنبيهات التحميل</h3>
          <ul className="flex flex-col divide-y divide-amber-500/10">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-fg">{p.name}</span>
                <span className="tnum text-xs text-muted">
                  تحميلات: {p.downloadCount} / طلبات: {p.ordersCount}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* آخر 10 طلبات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-fg">آخر الطلبات</h2>
          <Link href="/admin/orders" className="text-sm text-brand-300 hover:underline">
            كل الطلبات
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-muted">لسه مفيش طلبات.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:opacity-80"
                >
                  <div>
                    <p className="tnum font-bold text-fg">{o.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {o.customerName} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-sm font-semibold text-fg">
                      {formatPrice(o.totalCents || o.subtotalCents)}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? "border-brand-600/50 bg-brand-600/10" : "border-line bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="tnum mt-1 text-lg font-extrabold text-fg">{value}</p>
    </div>
  );
}

function RevenueCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="tnum mt-1 text-lg font-extrabold text-green-300">
        {formatPrice(value)}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className={`tnum text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
