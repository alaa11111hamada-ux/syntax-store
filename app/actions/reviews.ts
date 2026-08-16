"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasUserPurchased, hasUserReviewed } from "@/lib/reviews";
import { cleanStr } from "@/lib/validation";

export type ReviewState = { error?: string; ok?: boolean };

export async function addReviewAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول عشان تكتب تقييم." };

  const productId = cleanStr(formData.get("productId"), 40);
  const rating = parseInt(cleanStr(formData.get("rating"), 2), 10);
  const comment = cleanStr(formData.get("comment"), 1000);
  const imagesRaw = cleanStr(formData.get("images"), 50000);

  if (!productId) return { error: "منتج غير معروف." };
  if (rating < 1 || rating > 5) return { error: "التقييم لازم من 1 لـ 5." };

  const purchased = await hasUserPurchased(user.id, productId);
  if (!purchased)
    return { error: "ممكن تكتب تقييم بس بعد ما تشترى المنتج." };

  const alreadyReviewed = await hasUserReviewed(user.id, productId);
  if (alreadyReviewed) return { error: " كتبت تقييم على المنتج ده بالفعل." };

  let images: string[] = [];
  if (imagesRaw) {
    try {
      const parsed = JSON.parse(imagesRaw);
      if (Array.isArray(parsed)) {
        images = parsed.filter((x) => typeof x === "string").slice(0, 3);
      }
    } catch {}
  }

  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      rating,
      comment,
      images: JSON.stringify(images),
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * الإعجاب بتقييم — يزيد العداد.
 * (سيعمل بالكامل بعد إضافة حقل likes في الـ schema)
 */
export async function likeReviewAction(reviewId: string): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "التقييم غير موجود." };

  // likes field will be added in future schema migration
  // await prisma.review.update({
  //   where: { id: reviewId },
  //   data: { likes: { increment: 1 } },
  // });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * الإبلاغ عن تقييم.
 * (سيعمل بالكامل بعد إضافة حقل reported في الـ schema)
 */
export async function reportReviewAction(
  reviewId: string,
  reason: string
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "لازم تسجّل دخول." };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "التقييم غير موجود." };

  // reported field will be added in future schema migration
  // await prisma.review.update({
  //   where: { id: reviewId },
  //   data: { reported: true },
  // });

  revalidatePath("/", "layout");
  return { ok: true };
}
