"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type OrderActionState = {
  error?: string;
  ok?: boolean;
  downloadUrl?: string;
};

/**
 * "استلام تاني" — يغيّر الحالة لـ delivered.
 * العميل لوحده يقدر يعملها بس على طلب ملكه.
 */
export async function reReceiveOrder(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const orderId = typeof formData.get("orderId") === "string"
    ? (formData.get("orderId") as string).trim()
    : "";
  if (!orderId) return { error: "طلب غير معروف." };

  const user = await getCurrentUser();
  if (!user) return { error: "لازم تكون مسجّل الدخول." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, orderNumber: true },
  });
  if (!order) return { error: "الطلب مش موجود." };
  if (order.userId !== user.id) return { error: "مش طلبك." };
  if (order.status !== "delivered") {
    return { error: "ممكن تعمل استلام تاني بس بعد ما الطلب يتم التسليم." };
  }

  // تحديث حالة الطلب إلى "returned" (مرتجع)
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "returned" },
  });

  revalidatePath(`/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");

  return { ok: true };
}

/**
 * جلب حالة الطلب (للـ polling)
 */
export async function getOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  return order?.status ?? null;
}
