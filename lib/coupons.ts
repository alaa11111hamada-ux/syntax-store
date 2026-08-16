import "server-only";
import { prisma } from "@/lib/prisma";

export type CouponResult = {
  valid: boolean;
  error?: string;
  discountCents?: number;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
};

/** التحقق من كوبون الخصم وحساب المبلغ */
export async function validateCoupon(
  code: string,
  subtotalCents: number,
  userId?: string | null,
  cartProductIds?: string[]
): Promise<CouponResult> {
  if (!code.trim()) return { valid: false, error: "ادخل كود الكوبون." };

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.active)
    return { valid: false, error: "كود الكوبون غير صالح." };

  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { valid: false, error: "انتهت صلاحية الكوبون." };

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
    return { valid: false, error: "الكوبون وصل لحد الاستخدام الأقصى." };

  // فحص خاص بعميل معيّن
  if (coupon.userId) {
    if (!userId || userId !== coupon.userId)
      return { valid: false, error: "الكوبون ده مخصص لعميل تاني." };
  }

  // فحص عدد الاستخدامات لكل عميل
  if (coupon.maxPerUser > 0 && userId) {
    const userUsageCount = await prisma.order.count({
      where: {
        userId,
        couponCode: coupon.code,
        status: { notIn: ["cancelled", "returned"] },
      },
    });
    if (userUsageCount >= coupon.maxPerUser)
      return { valid: false, error: `وصلت للحد الأقصى من استخدام الكوبون ده (${coupon.maxPerUser} مرة).` };
  }

  // فحص خاص بمنتج معيّن
  if (coupon.productId) {
    if (!cartProductIds || !cartProductIds.includes(coupon.productId))
      return { valid: false, error: "الكوبون ده خاص بمنتج تاني." };
  }

  if (subtotalCents < coupon.minOrderCents)
    return {
      valid: false,
      error: `الحد الأدنى للطلب ${coupon.minOrderCents / 100} ج.م.`,
    };

  let discountCents: number;
  if (coupon.discountType === "percent") {
    discountCents = Math.round((subtotalCents * coupon.discountValue) / 100);
  } else {
    discountCents = Math.min(coupon.discountValue, subtotalCents);
  }

  return {
    valid: true,
    discountCents,
    couponId: coupon.id,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}

/** استخدام الكوبون (زيادة العداد بشكل آمن — atomic shell-safe) */
export async function useCoupon(couponId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE Coupon SET usedCount = usedCount + 1 WHERE id = ? AND (maxUses = 0 OR usedCount < maxUses)`,
    couponId
  );
}

/** كل الكوبونات */
export async function getAllCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

/** حذف كوبون */
export async function deleteCoupon(id: string) {
  return prisma.coupon.delete({ where: { id } });
}
