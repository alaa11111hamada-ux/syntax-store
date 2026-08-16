import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllOrdersFlat } from "@/lib/orders";
import { ordersToCsv } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const orders = await getAllOrdersFlat(status);
  const csv = ordersToCsv(orders.items);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
