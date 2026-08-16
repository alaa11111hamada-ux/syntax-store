import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentMethodById, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "missing orderId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  if (user.role !== "admin" && order.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const [paymentMethod, settings] = await Promise.all([
    getPaymentMethodById(order.paymentMethod),
    getSettings(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      storeName: settings.store_name || "سينتاكس Store",
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      createdAt: new Date(order.createdAt).toLocaleDateString("ar-EG"),
      subtotalCents: order.subtotalCents,
      taxCents: 0,
      taxRate: 0,
      discountCents: order.discountCents,
      totalCents: order.totalCents || order.subtotalCents,
      paymentMethod: order.paymentMethod,
      paymentMethodName: paymentMethod?.name || "",
      paymentMethodFields: paymentMethod?.fields || [],
      couponCode: order.couponCode,
      couponDiscountCents: order.discountCents,
      productDiscountCents: 0,
      items: order.items.map((i) => ({
        name: i.name,
        priceCents: i.priceCents,
        qty: i.qty,
      })),
    },
  });
}
