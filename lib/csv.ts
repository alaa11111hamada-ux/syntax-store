import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

/** حماية من CSV injection — يضيف apostrophe لو بيعمل formula */
function sanitizeCsvCell(value: string): string {
  const dangerous = /^[=+\-@\t\r]/;
  return dangerous.test(value) ? `'${value}` : value;
}

/** تصدير الطلبات بصيغة CSV */
export function ordersToCsv(orders: OrderWithItems[]): string {
  const headers = [
    "رقم الطلب",
    "اسم العميل",
    "الموبايل",
    "الإيميل",
    "طريقة الدفع",
    "الحالة",
    "المجموع",
    "الإجمالي",
    "العناصر",
    "التاريخ",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerName,
    o.customerPhone,
    o.customerEmail ?? "",
    o.paymentMethod === "cash" ? "كاش" : "تحويل",
    o.status,
    `${o.subtotalCents / 100}`,
    `${o.totalCents / 100}`,
    o.items.map((i) => `${i.name} x${i.qty}`).join(" | "),
    new Date(o.createdAt).toLocaleDateString("ar-EG"),
  ]);

  const BOM = "\uFEFF";
  const csv =
    BOM +
    headers.join(",") +
    "\n" +
    rows.map((r) => r.map((c) => `"${sanitizeCsvCell(String(c).replace(/"/g, '""'))}"`).join(",")).join("\n");
  return csv;
}
