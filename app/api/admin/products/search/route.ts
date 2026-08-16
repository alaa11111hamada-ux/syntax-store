import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { slug: { contains: q } },
      ],
    },
    select: { id: true, name: true },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}
