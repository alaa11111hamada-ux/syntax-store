"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function exportProducts() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDesc: true,
      priceCents: true,
      compareAtCents: true,
      currency: true,
      category: true,
      subcategory: true,
      tags: true,
      featured: true,
      active: true,
      downloadCount: true,
      createdAt: true,
    },
  });

  return JSON.stringify(products, null, 2);
}

export async function exportOrders() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const data = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    paymentMethod: o.paymentMethod,
    status: o.status,
    subtotalCents: o.subtotalCents,
    totalCents: o.totalCents,
    discountCents: o.discountCents,
    couponCode: o.couponCode,
    source: o.source,
    note: o.note,
    itemsCount: o.items.length,
    userName: o.user?.name ?? "زائر",
    createdAt: o.createdAt.toISOString(),
  }));

  return JSON.stringify(data, null, 2);
}

export async function exportCustomers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      creditCents: true,
      blocked: true,
      createdAt: true,
    },
  });

  const header = "ID,Name,Email,Phone,Role,CreditCents,Blocked,CreatedAt";
  const rows = users.map((u) =>
    [
      u.id,
      `"${(u.name || "").replace(/"/g, '""')}"`,
      u.email,
      u.phone || "",
      u.role,
      u.creditCents,
      u.blocked ? "Yes" : "No",
      u.createdAt.toISOString(),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
