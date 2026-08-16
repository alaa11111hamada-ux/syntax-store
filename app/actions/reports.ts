"use server";

import "server-only";
import { prisma } from "@/lib/prisma";

export type SalesReportData = {
  totalOrders: number;
  totalRevenueCents: number;
  avgOrderValueCents: number;
  topProducts: { name: string; qty: number; revenueCents: number }[];
  daily: { date: string; orders: number; revenueCents: number }[];
};

export async function getSalesReport(from?: string, to?: string): Promise<SalesReportData> {
  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400_000);
  const endDate = to ? new Date(to + "T23:59:59") : new Date();

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { items: true },
  });

  const totalOrders = orders.length;
  const totalRevenueCents = orders
    .filter((o) => o.status === "confirmed" || o.status === "delivered")
    .reduce((s, o) => s + o.totalCents, 0);
  const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

  const productMap = new Map<string, { name: string; qty: number; revenueCents: number }>();
  for (const order of orders) {
    if (order.status === "cancelled" || order.status === "returned") continue;
    for (const item of order.items) {
      const existing = productMap.get(item.name) ?? { name: item.name, qty: 0, revenueCents: 0 };
      existing.qty += item.qty;
      existing.revenueCents += item.priceCents * item.qty;
      productMap.set(item.name, existing);
    }
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 20);

  const dailyMap = new Map<string, { orders: number; revenueCents: number }>();
  const dayMs = 86400_000;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate.getTime() + i * dayMs);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { orders: 0, revenueCents: 0 });
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.orders += 1;
      if (order.status === "confirmed" || order.status === "delivered") {
        entry.revenueCents += order.totalCents;
      }
    }
  }
  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return { totalOrders, totalRevenueCents, avgOrderValueCents, topProducts, daily };
}

export async function exportSalesReport(from?: string, to?: string) {
  const report = await getSalesReport(from, to);

  const lines: string[] = [
    "التاريخ من,إلى," + (from ?? "البداية") + "," + (to ?? "النهاية"),
    "",
    "الإحصائيات",
    "إجمالي الطلبات," + report.totalOrders,
    "إجمالي الإيرادات," + report.totalRevenueCents,
    "متوسط قيمة الطلب," + report.avgOrderValueCents,
    "",
    "المنتجات الأكثر مبيعاً",
    "المنتج,الكمية,الإيراد بالقروش",
    ...report.topProducts.map((p) => `${p.name},${p.qty},${p.revenueCents}`),
    "",
    "التفصيل اليومي",
    "التاريخ,الطلبات,الإيراد بالقروش",
    ...report.daily.map((d) => `${d.date},${d.orders},${d.revenueCents}`),
  ];

  const csv = "\uFEFF" + lines.join("\n");
  const encoded = Buffer.from(csv, "utf-8").toString("base64");
  return { dataUrl: `data:text/csv;base64,${encoded}` };
}
