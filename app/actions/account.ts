"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, destroySession } from "@/lib/auth";
import { cleanStr, isValidPhone } from "@/lib/validation";

export type AccountState = { error?: string; ok?: boolean };

export async function updateProfileAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const name = cleanStr(formData.get("name"), 80);
  const phone = cleanStr(formData.get("phone"), 20);

  if (name.length < 2) return { error: "اكتب اسمك بشكل صحيح." };
  if (phone && !isValidPhone(phone)) return { error: "رقم الموبايل غير صحيح." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const currentPassword = typeof formData.get("currentPassword") === "string"
    ? (formData.get("currentPassword") as string)
    : "";
  const newPassword = typeof formData.get("newPassword") === "string"
    ? (formData.get("newPassword") as string)
    : "";
  const confirmPassword = typeof formData.get("confirmPassword") === "string"
    ? (formData.get("confirmPassword") as string)
    : "";

  if (!currentPassword) return { error: "ادخل كلمة السر الحالية." };
  if (newPassword.length < 6) return { error: "كلمة السر الجديدة لازم 6 حروف على الأقل." };
  if (newPassword !== confirmPassword) return { error: "كلمتا السر غير متطابقتين." };

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return { error: "حدث خطأ." };

  const valid = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!valid) return { error: "كلمة السر الحالية غير صحيحة." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { ok: true };
}

export async function deleteAccountAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const password = typeof formData.get("password") === "string"
    ? (formData.get("password") as string)
    : "";

  if (!password) return { error: "ادخل كلمة السر للتأكيد." };

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return { error: "حدث خطأ." };

  const valid = await verifyPassword(password, fullUser.passwordHash);
  if (!valid) return { error: "كلمة السر غير صحيحة." };

  // حذف البيانات المرتبطة أولاً
  const userOrderIds = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map(o => o.id);
  await prisma.ticketMessage.deleteMany({ where: { ticket: { userId: user.id } } });
  await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
  await prisma.review.deleteMany({ where: { userId: user.id } });
  if (userOrderIds.length > 0) {
    await prisma.orderComment.deleteMany({ where: { orderId: { in: userOrderIds } } });
  }
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return { ok: true };
}
