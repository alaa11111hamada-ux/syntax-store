import Link from "next/link";
import { getAllOrders, ORDER_STATUSES, statusLabel } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatus";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function AdminOrders({ searchParams }: Props) {
  const { status, q, page } = await searchParams;
  const active = status && ORDER_STATUSES.includes(status as never) ? status : "";
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const result = await getAllOrders({ status: active || undefined, search: q || undefined, page: pageNum, perPage: 20 });

  const filters = [
    { key: "", label: "الكل" },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: statusLabel(s) })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-fg">الطلبات ({result.total})</h2>
        <a
          href={`/api/orders/csv${active ? `?status=${active}` : ""}`}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          تصدير CSV
        </a>
      </div>

      {/* بحث */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ابحث برقم الطلب أو اسم العميل..."
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none"
        />
        {active && <input type="hidden" name="status" value={active} />}
        <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">بحث</button>
      </form>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = f.key === active;
          const params = new URLSearchParams();
          if (f.key) params.set("status", f.key);
          if (q) params.set("q", q);
          return (
            <Link
              key={f.key || "all"}
              href={`/admin/orders${params.toString() ? `?${params.toString()}` : ""}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand-500 bg-brand-600/15 text-brand-200"
                  : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          مفيش طلبات في الحالة دي.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-600/50"
              >
                <div className="min-w-0">
                  <p className="tnum font-bold text-fg">{o.orderNumber}</p>
                  <p className="text-sm text-muted">
                    {o.customerName} · {o.items.length} منتج ·{" "}
                    {o.paymentMethod === "cash" ? "كاش" : "تحويل"}
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

      <Pagination page={result.page} totalPages={result.totalPages} baseUrl="/admin/orders" />
    </div>
  );
}
