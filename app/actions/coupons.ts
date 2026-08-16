"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { cleanStr } from "@/lib/validation";

export type CouponFormState = { error?: string; ok?: boolean };

const COUPON_CODE_RE = /^[A-Z0-9]+$/;

export async function createCouponAction(
  _prev: CouponFormState,
  formData: FormData
): Promise<CouponFormState> {
  const admin = await requireAdmin();
  const code = cleanStr(formData.get("code"), 30).toUpperCase();
  const discountType =
    cleanStr(formData.get("discountType"), 10) === "fixed"
      ? "fixed"
      : "percent";
  const discountValue = parseInt(cleanStr(formData.get("discountValue"), 10), 10) || 0;
  const minOrderCents =
    parseInt(cleanStr(formData.get("minOrderCents"), 10), 10) * 100 || 0;
  const maxUses = parseInt(cleanStr(formData.get("maxUses"), 10), 10) || 0;
  const maxPerUser = parseInt(cleanStr(formData.get("maxPerUser"), 10), 10) || 0;
  const expiresAtRaw = cleanStr(formData.get("expiresAt"), 30);
  const productId = cleanStr(formData.get("productId"), 40) || null;
  const userEmail = cleanStr(formData.get("userEmail"), 100);

  if (!code) return { error: "اكتب الكوبون." };
  if (!COUPON_CODE_RE.test(code))
    return { error: "الكود لازم يكون حروف إنجليزية كبيرة وأرقام فقط (بدون مسافات أو رموز)." };
  if (!discountValue || discountValue <= 0)
    return { error: "قيمة الخصم غير صحيحة." };
  if (discountType === "percent" && discountValue > 100)
    return { error: "النسبة مش ممكن تزيد عن 100%." };

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return { error: "الكوبون ده موجود بالفعل." };

  let userId: string | null = null;
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return { error: "لا يوجد مستخدم بهذا الإيميل." };
    userId = user.id;
  }

  await prisma.coupon.create({
    data: {
      code,
      discountType,
      discountValue,
      minOrderCents,
      maxUses,
      maxPerUser,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      productId,
      userId,
    },
  });

  await logAudit(admin.id, "create", "coupon", null, { code });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function updateCouponAction(
  _prev: CouponFormState,
  formData: FormData
): Promise<CouponFormState> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (!id) return { error: "معرف الكوبون غير صحيح." };

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return { error: "الكوبون غير موجود." };

  const code = cleanStr(formData.get("code"), 30).toUpperCase();
  const discountType =
    cleanStr(formData.get("discountType"), 10) === "fixed"
      ? "fixed"
      : "percent";
  const discountValue = parseInt(cleanStr(formData.get("discountValue"), 10), 10) || 0;
  const minOrderCents =
    parseInt(cleanStr(formData.get("minOrderCents"), 10), 10) * 100 || 0;
  const maxUses = parseInt(cleanStr(formData.get("maxUses"), 10), 10) || 0;
  const maxPerUser = parseInt(cleanStr(formData.get("maxPerUser"), 10), 10) || 0;
  const expiresAtRaw = cleanStr(formData.get("expiresAt"), 30);
  const productId = cleanStr(formData.get("productId"), 40) || null;
  const userEmail = cleanStr(formData.get("userEmail"), 100);
  const active = formData.get("active") !== "false";

  if (!code) return { error: "اكتب الكوبون." };
  if (!COUPON_CODE_RE.test(code))
    return { error: "الكود لازم يكون حروف إنجليزية كبيرة وأرقام فقط (بدون مسافات أو رموز)." };
  if (!discountValue || discountValue <= 0)
    return { error: "قيمة الخصم غير صحيحة." };
  if (discountType === "percent" && discountValue > 100)
    return { error: "النسبة مش ممكن تزيد عن 100%." };

  if (code !== existing.code) {
    const duplicate = await prisma.coupon.findUnique({ where: { code } });
    if (duplicate) return { error: "الكود ده مستخدم لكوبون تاني." };
  }

  let userId: string | null = null;
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return { error: "لا يوجد مستخدم بهذا الإيميل." };
    userId = user.id;
  }

  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      discountType,
      discountValue,
      minOrderCents,
      maxUses,
      maxPerUser,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      productId,
      userId,
      active,
    },
  });

  await logAudit(admin.id, "update", "coupon", id, { code });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (id) {
    await prisma.coupon.delete({ where: { id } });
    await logAudit(admin.id, "delete", "coupon", id);
    revalidatePath("/admin/settings");
    revalidatePath("/admin/coupons");
  }
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  const active = formData.get("active") === "true";
  if (id) {
    await prisma.coupon.update({ where: { id }, data: { active: !active } });
    await logAudit(admin.id, "update", "coupon", id, { active: !active });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/coupons");
  }
}
