import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiter محوّل إلى SQLite — يعمل بشكل متواصل
 * ولا يُفقد عند إعادة تشغيل السيرفر.
 */

async function cleanup() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    await prisma.$executeRawUnsafe(
      "DELETE FROM RateLimit WHERE resetAt < ?",
      cutoff.toISOString()
    );
  } catch {}
}

/**
 * Rate limiter باستخدام SQLite — يستمر بين طلبات السيرفر.
 * يرجّع true لو المسموح، false لو تجاوز الحد.
 */
export async function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // محاولة تنظيف البيانات القديمة كل 100 طلب تقريباً
    if (Math.random() < 0.01) await cleanup();

    // محاولة زيادة العدّاد
    const updated = await prisma.$executeRawUnsafe(
      `UPDATE RateLimit SET count = count + 1, resetAt = ?
       WHERE key = ? AND resetAt > ?`,
      resetAt.toISOString(),
      key,
      now.toISOString()
    );

    if (updated > 0) {
      // تم تحديث — نقرأ العدد الحالي
      const row = await prisma.$executeRawUnsafe(
        `SELECT count FROM RateLimit WHERE key = ? AND resetAt > ?`,
        key,
        now.toISOString()
      );
      // raw result for SQLite
      const countRow = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count FROM RateLimit WHERE key = ? AND resetAt > ?`,
        key,
        now.toISOString()
      );
      if (countRow.length > 0) {
        return countRow[0].count <= maxHits;
      }
      return true;
    }

    // لا يوجد سجل — نُنشئ واحداً
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO RateLimit (key, count, resetAt) VALUES (?, 1, ?)`,
      key,
      resetAt.toISOString()
    );
    return true;
  } catch {
    // في حالة أي خطأ، اسمح بالطلب (أفضل من حظر الجميع)
    return true;
  }
}

/** عدّاد محاولات فشل تسجيل الدخول */
export async function checkLoginRate(email: string): Promise<boolean> {
  return rateLimit(`login:${email}`, 5, 15 * 60 * 1000);
}

/** عدّاد إنشاء حساب */
export async function checkRegisterRate(ip: string): Promise<boolean> {
  return rateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
}

/** عدّاد Checkout */
export async function checkCheckoutRate(userId: string): Promise<boolean> {
  return rateLimit(`checkout:${userId}`, 10, 60 * 60 * 1000);
}
