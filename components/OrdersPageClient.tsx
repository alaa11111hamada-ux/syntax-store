"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type Props = {
  initialOrders: Order[];
  baseUrl: string;
};

const POLL_INTERVAL = 10_000;

export default function OrdersPageClient({ initialOrders, baseUrl }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/account/orders", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold text-fg">طلباتي</h1>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-muted">مفيش طلبات.</p>
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
                className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-600/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="tnum font-bold text-fg">{order.orderNumber}</p>
                    <p className="tnum text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")} ·{" "}
                      {order.itemsCount} منتج · {formatPrice(order.totalCents)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
