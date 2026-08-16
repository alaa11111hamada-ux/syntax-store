import "server-only";
import { prisma } from "@/lib/prisma";
import type { Order, OrderItem } from "@prisma/client";
import { ORDER_STATUSES, type OrderStatus, type NewOrderInput } from "@/lib/order-constants";

export type { OrderStatus, NewOrderInput, NewOrderItem, OrderFilters } from "@/lib/order-constants";
export { ORDER_STATUSES, STATUS_LABELS, STATUS_FLOW, statusLabel } from "@/lib/order-constants";

export type OrderWithItems = Order & { items: OrderItem[] };

// ===== توليد رقم طلب مقروء وفريد =====
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function generateOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `SYX-${randomCode(6)}`;
    const exists = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `SYX-${randomCode(9)}`;
}

export async function createOrder(input: NewOrderInput) {
  const subtotalCents = input.items.reduce(
    (sum, i) => sum + i.priceCents * i.qty,
    0
  );
  const discountCents = Math.min(input.discountCents ?? 0, subtotalCents);
  const taxCents = Math.max(0, input.taxCents ?? 0);
  const orderNumber = await generateOrderNumber();

  return prisma.order.create({
    data: {
      orderNumber,
      userId: input.userId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      address: input.address,
      paymentMethod: input.paymentMethod,
      proofImage: input.proofImage,
      note: input.note,
      couponCode: input.couponCode || null,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents + taxCents,
      status: "pending",
      items: {
        create: input.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          priceCents: i.priceCents,
          qty: i.qty,
        })),
      },
    },
    include: { items: true },
  });
}

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: { items: true },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export type PaginatedOrders = {
  items: OrderWithItems[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function getAllOrders(
  filters: { status?: string; search?: string; page?: number; perPage?: number } = {}
): Promise<PaginatedOrders> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));
  const where: Record<string, unknown> = {};

  if (filters.status && ORDER_STATUSES.includes(filters.status as OrderStatus)) {
    where.status = filters.status;
  }
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search } },
      { customerName: { contains: filters.search } },
      { customerPhone: { contains: filters.search } },
      { customerEmail: { contains: filters.search } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getAllOrdersFlat(status?: string, page = 1, perPage = 50) {
  const where = status && ORDER_STATUSES.includes(status as OrderStatus)
    ? { status }
    : undefined;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);

  return { items: rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function getStats() {
  const [statusCounts, revenueResult, products, users] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["confirmed", "delivered"] } },
      _sum: { totalCents: true },
    }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "customer" } }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusCounts) {
    byStatus[row.status] = row._count.id;
  }

  return {
    ordersCount: statusCounts.reduce((s, r) => s + r._count.id, 0),
    productsCount: products,
    customersCount: users,
    revenueCents: revenueResult._sum.totalCents ?? 0,
    pending: byStatus["pending"] ?? 0,
    confirmed: byStatus["confirmed"] ?? 0,
    delivered: byStatus["delivered"] ?? 0,
    cancelled: byStatus["cancelled"] ?? 0,
    returned: byStatus["returned"] ?? 0,
  };
}
