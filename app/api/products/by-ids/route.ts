import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/products";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 12) : [];

    if (ids.length === 0) return NextResponse.json([]);

    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });

    const ordered = ids
      .map((id) => rows.find((r) => r.id === id))
      .filter(Boolean)
      .map((r) => toProductView(r!));

    return NextResponse.json(ordered);
  } catch {
    return NextResponse.json([]);
  }
}
