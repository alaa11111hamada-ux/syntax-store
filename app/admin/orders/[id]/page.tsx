import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, ORDER_STATUSES, statusLabel } from "@/lib/orders";
import { setOrderStatusAction, addOrderCommentAction } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatus";
import OrderComments from "@/components/admin/OrderComments";
import { prisma } from "@/lib/prisma";
import InvoiceButton from "@/components/InvoiceButton";
import { getPaymentMethodById } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetail({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [comments, paymentMethod] = await Promise.all([
    prisma.orderComment.findMany({
      where: { orderId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getPaymentMethodById(order.paymentMethod),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-brand-300 hover:underline">
            ← كل الطلبات
          </Link>
          <h2 className="tnum mt-1 text-xl font-extrabold text-fg">
            {order.orderNumber}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <InvoiceButton orderId={order.id} />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* مصدر الطلب + الكوبون + الإحالة */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-3 font-bold text-fg">تفاصيل إضافية</h3>
        <ul className="space-y-1.5 text-sm text-muted">
          {order.source && (
            <li>
              مصدر الطلب:{" "}
              <span className="font-semibold text-fg">{order.source}</span>
            </li>
          )}
          <li>
            كوبون الخصم:{" "}
            <span className="font-semibold text-fg">
              {order.couponCode || "—"}
            </span>
          </li>
          <li>
            مبلغ الخصم:{" "}
            <span className="tnum font-semibold text-green-400">
              {order.discountCents > 0 ? `-${formatPrice(order.discountCents)}` : "—"}
            </span>
          </li>
        </ul>
      </section>

      {/* تغيير الحالة */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-3 font-bold text-fg">تغيير حالة الطلب</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => {
            const isCurrent = s === order.status;
            return (
              <form action={setOrderStatusAction} key={s}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  disabled={isCurrent}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "border-brand-500 bg-brand-600/20 text-brand-200"
                      : "border-line bg-bg text-fg hover:border-brand-600/50 hover:bg-surface-2"
                  }`}
                >
                  {statusLabel(s)}
                </button>
              </form>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          الحالة الحالية مميّزة. اضغط على أي حالة عشان تغيّرها فوراً.
        </p>
      </section>

      {/* المنتجات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">المنتجات</h3>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium text-fg">{item.name}</p>
                <p className="tnum text-sm text-muted">
                  {formatPrice(item.priceCents)} × {item.qty}
                </p>
              </div>
              <span className="tnum font-bold text-fg">
                {formatPrice(item.priceCents * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>المجموع الفرعي</span>
            <span className="tnum">{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>الخصم{order.couponCode ? ` (${order.couponCode})` : ""}</span>
            <span className="tnum text-green-400">
              {order.discountCents > 0 ? `-${formatPrice(order.discountCents)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <span className="font-semibold text-fg">الإجمالي</span>
            <span className="tnum text-lg font-extrabold text-fg">
              {formatPrice(order.totalCents || order.subtotalCents)}
            </span>
          </div>
        </div>
      </section>

      {/* العميل + الدفع */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold text-fg">العميل</h3>
          <ul className="space-y-1 text-sm text-muted">
            <li>
              الاسم: <span className="text-fg">{order.customerName}</span>
            </li>
            <li className="tnum">
              الموبايل: <span className="text-fg">{order.customerPhone}</span>
            </li>
            {order.customerEmail && (
              <li>
                الإيميل: <span className="text-fg">{order.customerEmail}</span>
              </li>
            )}
            {order.address && (
              <li>
                العنوان: <span className="text-fg">{order.address}</span>
              </li>
            )}
            <li>
              نوع الحساب:{" "}
              <span className="text-fg">
                {order.userId ? "عميل مسجّل" : "زائر"}
              </span>
            </li>
            {order.note && (
              <li>
                ملاحظات: <span className="text-fg">{order.note}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold text-fg">الدفع</h3>
          <p className="text-sm text-muted">
            الطريقة:{" "}
            <span className="text-fg">
              {paymentMethod?.name || (order.paymentMethod === "cash" ? "كاش عند الاستلام" : "تحويل / محفظة")}
            </span>
          </p>
          {paymentMethod && paymentMethod.fields.length > 0 && (
            <ul className="tnum mt-2 space-y-1 text-sm text-muted">
              {paymentMethod.fields.map((field, fi) => (
                <li key={fi}>
                  {field.label}: <span className="text-fg">{field.value}</span>
                </li>
              ))}
            </ul>
          )}
          {order.proofImage && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-muted">إثبات الدفع:</p>
              <a href={order.proofImage} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.proofImage}
                  alt="إثبات الدفع"
                  className="max-h-64 rounded-xl border border-line transition-opacity hover:opacity-90"
                />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* تعليقات الطلب */}
      <OrderComments
        orderId={order.id}
        comments={comments.map((c) => ({
          id: c.id,
          content: c.content,
          visible: c.visible,
          createdAt: c.createdAt.toISOString(),
          userName: c.user?.name ?? "أدمن",
        }))}
      />
    </div>
  );
}
