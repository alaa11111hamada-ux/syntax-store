"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cleanStr } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";

export type FlashSaleState = { error?: string; ok?: boolean };

export async function createFlashSaleAction(
  _prev: FlashSaleState,
  formData: FormData
): Promise<FlashSaleState> {
  await requireAdmin();
  const productId = cleanStr(formData.get("productId"), 50);
  const salePriceStr = cleanStr(formData.get("salePriceCents"), 20);
  const startsAt = cleanStr(formData.get("startsAt"), 50);
  const endsAt = cleanStr(formData.get("endsAt"), 50);

  if (!productId) return { error: "اختر منتجاً." };
  const salePriceCents = parseInt(salePriceStr, 10);
  if (isNaN(salePriceCents) || salePriceCents <= 0)
    return { error: "سعر العرض غير صحيح." };
  if (!startsAt || !endsAt) return { error: "حدد تاريخ البداية والنهاية." };

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    return { error: "تواريخ غير صالحة." };
  if (end <= start) return { error: "تاريخ النهاية لازم بعد البداية." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "المنتج غير موجود." };

  await prisma.flashSale.create({
    data: {
      productId,
      salePriceCents,
      startsAt: start,
      endsAt: end,
      active: true,
    },
  });

  revalidatePath("/admin/flash-sales");
  return { ok: true };
}

export async function deleteFlashSaleAction(id: string): Promise<FlashSaleState> {
  await requireAdmin();
  const sale = await prisma.flashSale.findUnique({ where: { id } });
  if (!sale) return { error: "عرض غير موجود." };

  await prisma.flashSale.delete({ where: { id } });
  revalidatePath("/admin/flash-sales");
  return { ok: true };
}

export async function toggleFlashSaleAction(id: string): Promise<FlashSaleState> {
  await requireAdmin();
  const sale = await prisma.flashSale.findUnique({ where: { id } });
  if (!sale) return { error: "عرض غير موجود." };

  await prisma.flashSale.update({
    where: { id },
    data: { active: !sale.active },
  });

  revalidatePath("/admin/flash-sales");
  return { ok: true };
}
