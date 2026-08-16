import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const relatedParam = searchParams.get("related");

  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean).slice(0, 50);
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });
    return NextResponse.json({ products: rows.map(toProductView) });
  }

  if (relatedParam) {
    const excludeIds = relatedParam.split(",").filter(Boolean);
    const currentProducts = await prisma.product.findMany({
      where: { id: { in: excludeIds } },
      select: { category: true },
    });
    const categories = [...new Set(currentProducts.map((p) => p.category).filter(Boolean))];

    if (categories.length === 0) {
      const random = await prisma.product.findMany({
        where: { active: true, id: { notIn: excludeIds } },
        take: 6,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ products: random.map(toProductView) });
    }

    const rows = await prisma.product.findMany({
      where: { active: true, category: { in: categories }, id: { notIn: excludeIds } },
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ products: rows.map(toProductView) });
  }

  return NextResponse.json({ products: [] });
}
