"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OrderStatusBadge, OrderTimeline } from "@/components/OrderStatus";
import OrderLiveSection from "@/components/OrderLiveSection";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { createOrderTicketAction } from "@/app/actions/tickets";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string | null;
  paymentMethod: string;
  proofImage: string | null;
  note: string | null;
  subtotalCents: number;
  totalCents: number;
  discountCents: number;
  couponCode: string | null;
  items: { id: string; name: string; priceCents: number; qty: number }[];
  comments: { id: string; content: string; visible: boolean; createdAt: string; userName: string }[];
};

type PaymentMethodInfo = {
  name: string;
  fields: { label: string; value: string }[];
};

type DownloadFile = { name: string; url: string };

export default function OrderDetailClient({
  order,
  paymentMethod,
  downloadFiles,
  isOwnerOrAdmin,
}: {
  order: Order;
  paymentMethod: PaymentMethodInfo | null;
  downloadFiles: DownloadFile[];
  isOwnerOrAdmin: boolean;
}) {
  const [status, setStatus] = useState(order.status);
  const [comments, setComments] = useState(order.comments);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleHelp() {
    startTransition(async () => {
      const res = await createOrderTicketAction(order.id);
      if (res.ok && res.ticketId) {
        router.push(`/account/tickets/${res.ticketId}`);
      }
    });
  }

  return (
    <>
      {/* رأس التأكيد */}
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/15">
          <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-fg">استلمنا طلبك، شكراً!</h1>
        <p className="mt-1 text-muted">
          رقم طلبك: <span className="tnum select-all font-bold text-brand-300">{order.orderNumber}</span>
        </p>
        <p className="mt-1 text-xs text-muted">احتفظ بالرقم ده عشان تتابع حالة طلبك في أي وقت.</p>
      </div>

      {/* الحالة */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-fg">حالة الطلب</h2>
          <OrderStatusBadge status={status} />
        </div>
        <OrderTimeline status={status} />
      </section>

      {/* تحديث حي + تحميل */}
      {isOwnerOrAdmin && (
        <OrderLiveSection
          orderId={order.id}
          initialStatus={order.status}
          orderNumber={order.orderNumber}
          downloadFiles={downloadFiles}
          onStatusChange={setStatus}
          onCommentsChange={setComments}
        />
      )}

      {/* العناصر */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-bold text-fg">المنتجات</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium text-fg">{item.name}</p>
                <p className="tnum text-sm text-muted">{formatPrice(item.priceCents)} × {item.qty}</p>
              </div>
              <span className="tnum font-bold text-fg">{formatPrice(item.priceCents * item.qty)}</span>
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
          <div className="flex items-center justify-between">
            <span className="font-semibold text-fg">الإجمالي</span>
            <span className="tnum text-lg font-extrabold text-fg">{formatPrice(order.totalCents || order.subtotalCents)}</span>
          </div>
        </div>
      </section>

      {/* التعليقات */}
      {(() => {
        const visibleComments = comments.filter((c) => c.visible);
        if (visibleComments.length === 0) return null;
        return (
          <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 font-bold text-fg">رسائل من المتجر</h2>
            <div className="flex flex-col gap-3">
              {visibleComments.map((c) => (
                <div key={c.id} className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-3">
                  <p className="whitespace-pre-wrap text-sm text-fg">{c.content}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.userName} · {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* الدفع والبيانات */}
      {isOwnerOrAdmin && (
        <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-bold text-fg">الدفع</h2>
            <p className="text-sm text-muted">
              الطريقة: <span className="text-fg">{paymentMethod?.name || "تحويل / محفظة"}</span>
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
                <Image src={order.proofImage} alt="إثبات الدفع من العميل" unoptimized width={384} height={192} className="max-h-48 rounded-xl border border-line" />
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-3 font-bold text-fg">بيانات المستلِم</h2>
            <ul className="space-y-1 text-sm text-muted">
              <li>الاسم: <span className="text-fg">{order.customerName}</span></li>
              <li className="tnum">الموبايل: <span className="text-fg">{order.customerPhone}</span></li>
              {order.customerEmail && <li>الإيميل: <span className="text-fg">{order.customerEmail}</span></li>}
              {order.address && <li>العنوان: <span className="text-fg">{order.address}</span></li>}
            </ul>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/#products" className="rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-fg transition-colors hover:bg-surface-2">
          كمّل التسوّق
        </Link>
        <button
          type="button"
          onClick={handleHelp}
          disabled={isPending}
          className="rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isPending ? "جاري الإنشاء..." : "محتاج مساعدة؟ كلّمنا"}
        </button>
      </div>
    </>
  );
}
