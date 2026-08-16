import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatus";
import { CustomerActions } from "./CustomerActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer || customer.role !== "customer") notFound();

  const totalSpent = customer.orders
    .filter((o) => o.status === "confirmed" || o.status === "delivered")
    .reduce((s, o) => s + o.totalCents, 0);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(d);

  const formatDateFull = (d: Date) =>
    new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-fg">تفاصيل العميل</h2>
        <Link
          href="/admin/customers"
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
        >
          رجوع
        </Link>
      </div>

      {/* الملف الشخصي */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-fg">
              {customer.name}
              {customer.blocked && (
                <span className="ms-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                  محظور
                </span>
              )}
            </h3>
            <div className="mt-2 space-y-1 text-sm text-muted">
              <p>
                <span className="ms-1 text-fg">الإيميل:</span> {customer.email}
              </p>
              {customer.phone && (
                <p>
                  <span className="ms-1 text-fg">التليفون:</span>{" "}
                  <span className="tnum">{customer.phone}</span>
                </p>
              )}
              <p>
                <span className="ms-1 text-fg">تاريخ التسجيل:</span>{" "}
                {formatDateFull(customer.createdAt)}
              </p>
              {customer.lastLoginAt && (
                <p>
                  <span className="ms-1 text-fg">آخر دخول:</span>{" "}
                  {formatDateFull(customer.lastLoginAt)}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-line bg-bg px-4 py-3">
              <p className="tnum text-xl font-extrabold text-fg">{customer.orders.length}</p>
              <p className="text-xs text-muted">طلبات</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <p className="tnum text-xl font-extrabold text-green-300">
                {formatPrice(totalSpent)}
              </p>
              <p className="text-xs text-muted">إجمالي الإنفاق</p>
            </div>
          </div>
        </div>
      </section>

      {/* ملاحظات + حظر */}
      <CustomerActions
        userId={customer.id}
        blocked={customer.blocked}
        notes={customer.notes}
      />

      {/* الطلبات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">طلبات العميل ({customer.orders.length})</h3>
        {customer.orders.length === 0 ? (
          <p className="text-sm text-muted">مفيش طلبات.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {customer.orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:opacity-80"
                >
                  <div>
                    <p className="tnum font-bold text-fg">{o.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {o.items.length} منتج · {formatDate(o.createdAt)}
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
