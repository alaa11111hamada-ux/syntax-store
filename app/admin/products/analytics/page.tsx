import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export default async function ProductAnalyticsPage({ searchParams }: Props) {
  const { q, sort } = await searchParams;
  const sortKey = sort === "orders" ? "orders" : sort === "downloads" ? "downloads" : "revenue";

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { category: { contains: q } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      downloadCount: true,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const productIds = products.map((p) => p.id);

  const orderItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: { status: { in: ["confirmed", "delivered", "pending"] } },
    },
    _sum: { priceCents: true, qty: true },
    _count: { id: true },
  });

  const itemMap = new Map(
    orderItems.map((oi) => [
      oi.productId,
      {
        ordersCount: oi._count.id,
        totalQty: oi._sum.qty ?? 0,
        revenueCents: (oi._sum.priceCents ?? 0) * (oi._sum.qty ?? 1),
      },
    ])
  );

  const enriched = products.map((p) => ({
    ...p,
    ordersCount: itemMap.get(p.id)?.ordersCount ?? 0,
    totalQty: itemMap.get(p.id)?.totalQty ?? 0,
    revenueCents: itemMap.get(p.id)?.revenueCents ?? 0,
  }));

  const sorted = [...enriched].sort((a, b) => {
    if (sortKey === "orders") return b.ordersCount - a.ordersCount;
    if (sortKey === "downloads") return b.downloadCount - a.downloadCount;
    return b.revenueCents - a.revenueCents;
  });

  const categoryMap = new Map<string, { count: number; revenue: number }>();
  for (const p of enriched) {
    const cat = p.category || "بدون تصنيف";
    const existing = categoryMap.get(cat) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += p.revenueCents;
    categoryMap.set(cat, existing);
  }
  const categories = [...categoryMap.entries()]
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10);

  const sortOptions = [
    { key: "revenue", label: "الإيراد" },
    { key: "orders", label: "الطلبات" },
    { key: "downloads", label: "التحميلات" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold text-fg">تحليلات المنتجات</h2>

      {/* بحث وفرز */}
      <div className="flex flex-wrap gap-3">
        <form className="flex flex-1 gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث عن منتج أو تصنيف..."
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            بحث
          </button>
        </form>
        <div className="flex gap-2">
          {sortOptions.map((s) => (
            <Link
              key={s.key}
              href={`/admin/products/analytics?sort=${s.key}${q ? `&q=${q}` : ""}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                sortKey === s.key
                  ? "border-brand-500 bg-brand-600/15 text-brand-200"
                  : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* تصنيفات */}
      {categories.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-4 font-bold text-fg">التصنيفات</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {categories.map(([cat, data]) => (
              <div key={cat} className="rounded-xl border border-line bg-bg px-4 py-3">
                <p className="truncate text-sm font-bold text-fg">{cat}</p>
                <p className="tnum text-xs text-muted">{data.count} منتج</p>
                <p className="tnum text-xs font-bold text-green-300">
                  {formatPrice(data.revenue)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* جدول المنتجات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">المنتجات ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">مفيش منتجات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-muted">
                  <th className="pb-2 ps-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">المنتج</th>
                  <th className="pb-2 font-semibold">التصنيف</th>
                  <th className="pb-2 font-semibold">الطلبات</th>
                  <th className="pb-2 font-semibold">الكمية</th>
                  <th className="pb-2 font-semibold">التحميلات</th>
                  <th className="pb-2 pe-2 font-semibold">الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id} className="border-b border-line/50">
                    <td className="py-2.5 ps-2 tnum text-muted">{i + 1}</td>
                    <td className="py-2.5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-semibold text-brand-300 hover:underline"
                      >
                        {p.name}
                      </Link>
                      {!p.active && (
                        <span className="ms-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                          غير نشط
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-muted">{p.category || "—"}</td>
                    <td className="py-2.5 tnum text-fg">{p.ordersCount}</td>
                    <td className="py-2.5 tnum text-fg">{p.totalQty}</td>
                    <td className="py-2.5 tnum text-fg">{p.downloadCount}</td>
                    <td className="py-2.5 pe-2 tnum font-bold text-green-300">
                      {formatPrice(p.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
