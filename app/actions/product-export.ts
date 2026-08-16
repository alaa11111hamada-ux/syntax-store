"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function exportProductsJson(): Promise<string> {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      slug: true,
      shortDesc: true,
      description: true,
      priceCents: true,
      compareAtCents: true,
      currency: true,
      category: true,
      subcategory: true,
      tags: true,
      images: true,
      fileUrl: true,
      fileName: true,
      featured: true,
      active: true,
    },
  });

  const data = products.map((p) => ({
    ...p,
    tags: (() => {
      try { return JSON.parse(p.tags); } catch { return []; }
    })(),
    images: (() => {
      try { return JSON.parse(p.images); } catch { return []; }
    })(),
  }));

  return JSON.stringify(data, null, 2);
}

export async function exportProductsCsv(): Promise<string> {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      slug: true,
      shortDesc: true,
      priceCents: true,
      compareAtCents: true,
      currency: true,
      category: true,
      subcategory: true,
      featured: true,
      active: true,
    },
  });

  const headers = ["name", "slug", "shortDesc", "priceCents", "compareAtCents", "currency", "category", "subcategory", "featured", "active"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const rows = products.map((p) =>
    headers.map((h) => {
      const val = p[h as keyof typeof p];
      if (typeof val === "string") return escape(val);
      if (typeof val === "boolean") return val ? "true" : "false";
      return String(val ?? "");
    }).join(",")
  );

  return "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
}
