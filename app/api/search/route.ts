import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/products";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const minPrice = req.nextUrl.searchParams.get("minPrice");
  const maxPrice = req.nextUrl.searchParams.get("maxPrice");
  const sort = req.nextUrl.searchParams.get("sort") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { active: true };

  if (q && q.length >= 1) {
    where.OR = [
      { name: { contains: q } },
      { category: { contains: q } },
      { tags: { contains: q } },
      { shortDesc: { contains: q } },
    ];
  }

  if (minPrice) where.priceCents = { ...(where.priceCents || {}), gte: Number(minPrice) };
  if (maxPrice) where.priceCents = { ...(where.priceCents || {}), lte: Number(maxPrice) };

  let orderBy: Record<string, string>[];
  switch (sort) {
    case "price_asc":
      orderBy = [{ priceCents: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ priceCents: "desc" }];
      break;
    case "name_asc":
      orderBy = [{ name: "asc" }];
      break;
    default:
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: 30,
  });

  return NextResponse.json({
    products: products.map(toProductView),
    total: products.length,
  });
}
