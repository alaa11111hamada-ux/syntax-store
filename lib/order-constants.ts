// Client-safe: types, constants, pure functions — no prisma/Node imports

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكّد",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مرتجع",
};

export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "delivered"];

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status;
}

export type NewOrderItem = {
  productId: string | null;
  name: string;
  priceCents: number;
  qty: number;
};

export type NewOrderInput = {
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string | null;
  paymentMethod: string;
  proofImage: string | null;
  note: string | null;
  couponCode?: string | null;
  discountCents?: number;
  taxCents?: number;
  items: NewOrderItem[];
};

export type OrderFilters = {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
};
