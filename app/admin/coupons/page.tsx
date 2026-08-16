import { prisma } from "@/lib/prisma";
import CouponAdminClient from "./CouponAdminClient";

export const metadata = { title: "أكواد الخصم" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [coupons, products] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const enriched = coupons.map((c) => ({
    ...c,
    productName: c.productId ? productMap.get(c.productId) ?? "—" : null,
  }));

  return (
    <CouponAdminClient
      coupons={enriched}
      products={products}
    />
  );
}
