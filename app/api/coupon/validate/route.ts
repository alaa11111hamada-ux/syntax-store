import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ valid: false, error: "ادخل الكود" });
  }

  const subtotalStr = searchParams.get("subtotal");
  const subtotal = subtotalStr ? Number(subtotalStr) : 0;
  const productIdsStr = searchParams.get("productIds");
  const productIds = productIdsStr ? productIdsStr.split(",").filter(Boolean) : [];

  const sessionUser = await getCurrentUser();
  const userId = sessionUser?.id ?? null;

  const result = await validateCoupon(code, subtotal, userId, productIds);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  return NextResponse.json({
    valid: true,
    discountType: result.discountType,
    discountValue: result.discountValue,
    discountCents: result.discountCents,
  });
}
