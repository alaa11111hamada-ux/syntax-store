"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, User, Ticket, Heart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatus";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalCents: number;
  itemsCount: number;
};

type Stats = {
  totalOrders: number;
  totalSpent: number;
};

type Props = {
  userName: string;
  userEmail: string;
  initialOrders: Order[];
  initialStats: Stats;
};

const POLL_INTERVAL = 10_000;

export default function AccountDashboard({
  userName,
  userEmail,
  initialOrders,
  initialStats,
}: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/account/stats", { cache: "no-store" }),
          fetch("/api/account/orders", { cache: "no-store" }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">أهلاً</p>
            <h1 className="text-xl font-extrabold text-fg">{userName}</h1>
            <p className="text-sm text-muted">{userEmail}</p>
          </div>
          <Link
            href="/account/profile"
            className="rounded-xl border border-line bg-bg px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            تعديل الملف
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">إجمالي الطلبات</p>
          <p className="tnum mt-1 text-2xl font-extrabold text-fg">{stats.totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">إجمالي المشتريات</p>
          <p className="tnum mt-1 text-2xl font-extrabold text-brand-300">
            {formatPrice(stats.totalSpent)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-600/50"
        >
          <Package className="h-4 w-4" /> طلباتي
        </Link>
        <Link
          href="/account/profile"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-600/50"
        >
          <User className="h-4 w-4" /> ملفي الشخصي
        </Link>
        <Link
          href="/account/tickets"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-600/50"
        >
          <Ticket className="h-4 w-4" /> تذاكر الدعم
        </Link>
        <Link
          href="/wishlist"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-600/50"
        >
          <Heart className="h-4 w-4" /> قائمة الأمنيات
        </Link>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-fg">آخر الطلبات</h2>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <Link href="/account/orders" className="text-sm text-brand-300 hover:underline">
              كل الطلبات
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="text-muted">لسه معملتش أي طلب.</p>
            <Link
              href="/#products"
              className="mt-4 inline-block rounded-xl bg-brand-gradient px-6 py-2.5 font-semibold text-white transition-opacity hover:opacity-95"
            >
              ابدأ التسوّق
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-600/50"
                >
                  <div>
                    <p className="tnum font-bold text-fg">{order.orderNumber}</p>
                    <p className="tnum text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")} ·{" "}
                      {order.itemsCount} منتج · {formatPrice(order.totalCents)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
