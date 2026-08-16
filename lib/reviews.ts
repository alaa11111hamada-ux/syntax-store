import "server-only";
import { prisma } from "@/lib/prisma";

export type ReviewWithUser = {
  id: string;
  rating: number;
  comment: string;
  images: string;
  approved: boolean;
  createdAt: Date;
  user: { name: string };
};

/** تقييمات منتج معتمدة فقط */
export async function getApprovedReviews(
  productId: string
): Promise<ReviewWithUser[]> {
  return prisma.review.findMany({
    where: { productId, approved: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** متوسط التقييمات لمنتج */
export async function getAverageRating(
  productId: string
): Promise<{ avg: number; count: number }> {
  const result = await prisma.review.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    avg: result._avg.rating ?? 0,
    count: result._count.rating ?? 0,
  };
}

/** كل التقييمات (للأدمن) */
export async function getAllReviews() {
  return prisma.review.findMany({
    include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** اعتماد تقييم */
export async function approveReview(id: string) {
  return prisma.review.update({
    where: { id },
    data: { approved: true },
  });
}

/** حذف تقييم */
export async function deleteReview(id: string) {
  return prisma.review.delete({ where: { id } });
}

/** التحقق إذا كان المستخدم اشترى المنتج (مسموح ليه يكتب تقييم) */
export async function hasUserPurchased(
  userId: string,
  productId: string
): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: {
      productId,
      order: {
        userId,
        status: { in: ["confirmed", "delivered"] },
      },
    },
  });
  return count > 0;
}

/** التحقق إذا كتب المستخدم تقييم من قبل */
export async function hasUserReviewed(
  userId: string,
  productId: string
): Promise<boolean> {
  const count = await prisma.review.count({
    where: { userId, productId },
  });
  return count > 0;
}
