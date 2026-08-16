import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const where = {
    role: "customer" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [customers, totalCustomers, activeCustomers, newThisWeek] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { totalCents: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", orders: { some: {} } } }),
    prisma.user.count({
      where: {
        role: "customer",
        createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
      },
    }),
  ]);

  const totalSpent = customers.reduce(
    (sum, c) => sum + c.orders.reduce((s, o) => s + o.totalCents, 0),
    0
  );
  const avgSpend = activeCustomers > 0 ? Math.round(totalSpent / activeCustomers) : 0;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(d);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-extrabold text-fg">العملاء</h2>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">إجمالي العملاء</p>
          <p className="tnum mt-1 text-lg font-extrabold text-fg">{totalCustomers}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">عملاء نشطون</p>
          <p className="tnum mt-1 text-lg font-extrabold text-blue-300">{activeCustomers}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">متوسط الإنفاق</p>
          <p className="tnum mt-1 text-lg font-extrabold text-green-300">
            {formatPrice(avgSpend)}
          </p>
        </div>
      </div>

      {/* بحث */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ابحث بالاسم أو الإيميل أو التليفون..."
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          بحث
        </button>
      </form>

      {/* قائمة العملاء */}
      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          {q ? "مفيش نتائج للبحث ده." : "لسه مفيش عملاء مسجّلين."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((c) => {
            const lastOrder = c.orders[0];
            const totalUserSpent = c.orders.reduce((s, o) => s + o.totalCents, 0);
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-600/50"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-fg">
                      {c.name}
                      {c.blocked && (
                        <span className="ms-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                          محظور
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {c.email}
                      {c.phone && <span className="tnum"> · {c.phone}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="tnum font-bold text-fg">{c._count.orders}</p>
                      <p className="text-xs text-muted">طلب</p>
                    </div>
                    <div className="text-center">
                      <p className="tnum font-bold text-green-300">{formatPrice(totalUserSpent)}</p>
                      <p className="text-xs text-muted">إجمالي</p>
                    </div>
                    <div className="text-center">
                      <p className="tnum text-xs text-muted">
                        {lastOrder ? formatDate(lastOrder.createdAt) : "—"}
                      </p>
                      <p className="text-xs text-muted">آخر طلب</p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
