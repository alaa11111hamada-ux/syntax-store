"use server";

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, createSession } from "@/lib/auth";
import { createOrder, type NewOrderItem } from "@/lib/orders";
import { getBumpOffer, getActivePaymentMethods } from "@/lib/settings";
import { site } from "@/lib/site";
import { validateCoupon, useCoupon } from "@/lib/coupons";
import { isValidEmail, isValidPhone, cleanStr } from "@/lib/validation";
import { checkCheckoutRate } from "@/lib/rate-limit";


export type CheckoutState = {
  error?: string;
  ok?: boolean;
  orderNumber?: string;
};

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];

type CartLine = { productId: string; qty: number };

function parseCart(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        productId: typeof x?.productId === "string" ? x.productId : "",
        qty: Math.floor(Number(x?.qty)),
      }))
      .filter((x) => x.productId && Number.isFinite(x.qty) && x.qty > 0 && x.qty <= 999);
  } catch {
    return [];
  }
}

async function saveProof(file: File): Promise<string> {
  if (!ALLOWED_IMAGE.includes(file.type)) {
    throw new Error("صورة الإثبات لازم تكون JPG أو PNG أو WEBP.");
  }
  if (file.size > MAX_PROOF_BYTES) {
    throw new Error("حجم الصورة كبير (الحد الأقصى 5 ميجا).");
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const rand = Array.from({ length: 20 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
  const filename = `${Date.now()}-${rand}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "proofs");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/proofs/${filename}`;
}

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  // 1) بيانات العميل
  const name = cleanStr(formData.get("customerName"), 80);
  const phone = cleanStr(formData.get("customerPhone"), 20);
  const email = cleanStr(formData.get("customerEmail"), 120).toLowerCase();
  const note = cleanStr(formData.get("note"), 500);
  const paymentMethod = cleanStr(formData.get("paymentMethod"), 20);
  const paymentMethodId = cleanStr(formData.get("paymentMethodId"), 40);
  const wantAccount = formData.get("createAccount") === "on";
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";

  // Rate limit
  const current = await getCurrentUser();
  const rateKey = current?.id || email || "guest";
  if (!(await checkCheckoutRate(rateKey)))
    return { error: "تم تجاوز الحد الأقصى للطلبات. جرّب بعد شوية." };

  // تحقق من حظر المستخدم
  if (current?.blocked) {
    return { error: "تم حظر حسابك. تواصل مع الدعم الفني." };
  }

  if (name.length < 2) return { error: "اكتب اسمك بشكل صحيح." };
  if (!isValidPhone(phone)) return { error: "رقم الموبايل غير صحيح." };
  if (!isValidEmail(email)) return { error: "الإيميل مطلوب للمنتجات الرقمية." };

  // تحقق من صلاحية طريقة الدفع
  let resolvedPaymentMethod = "transfer";
  if (paymentMethodId) {
    const methods = await getActivePaymentMethods();
    const selected = methods.find((m) => m.id === paymentMethodId && m.enabled);
    if (!selected) return { error: "طريقة الدفع غير صالحة." };
    resolvedPaymentMethod = selected.id;
  } else if (paymentMethod !== "transfer") {
    return { error: "اختر طريقة الدفع." };
  }

  // 2) السلة — نتحقّق من الأسعار من قاعدة البيانات (مش من العميل)
  const lines = parseCart(cleanStr(formData.get("items"), 20000));
  if (lines.length === 0) return { error: "سلتك فاضية." };

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: NewOrderItem[] = [];
  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) continue;
    items.push({
      productId: p.id,
      name: p.name,
      priceCents: p.priceCents,
      qty: line.qty,
    });
  }
  if (items.length === 0)
    return { error: "المنتجات في سلتك مش متاحة حالياً." };

  // ═══ العرض الإضافي (Order Bump) ═══
  if (formData.get("bump") === "1") {
    const bump = await getBumpOffer();
    if (bump) {
      const alreadyAdded =
        items.some((i) => i.productId === bump.productId && i.priceCents === bump.bumpCents);
      if (!alreadyAdded) {
        items.push({
          productId: bump.productId,
          name: bump.name + " (عرض إضافي)",
          priceCents: bump.bumpCents,
          qty: 1,
        });
      }
    }
  }

  // 3) المستخدم: مسجّل / حساب جديد / زائر
  let userId: string | null = current?.id ?? null;

  if (!current && wantAccount) {
    if (!isValidEmail(email))
      return { error: "لإنشاء حساب لازم إيميل صحيح." };
    if (password.length < 6)
      return { error: "كلمة سر الحساب لازم 6 حروف على الأقل." };
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return { error: "فيه حساب بالإيميل ده. سجّل دخول الأول أو اشترِ كزائر." };
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        role: "customer",
      },
    });
    await createSession(user.id);
    userId = user.id;
  }

  // 5) إنشاء الطلب — منتجات رقمية بدون شحن
  // المجموع الفرعي للمنتجات الأصلية فقط (بدون العرض الإضافي)
  const mainProductSubtotalCents = items
    .filter((i) => !i.name.includes("(عرض إضافي)"))
    .reduce((s, i) => s + i.priceCents * i.qty, 0);
  const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const isFreeOrder = mainProductSubtotalCents === 0;

  // 4) إثبات الدفع (مطلوب للتحويل — مش مطلوب لو الإجمالي صفر)
  let proofImage: string | null = null;
  if (!isFreeOrder) {
    const proof = formData.get("proof");
    if (!(proof instanceof File) || proof.size === 0) {
      return { error: "ارفع صورة إثبات التحويل." };
    }
    try {
      proofImage = await saveProof(proof);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "فشل رفع الصورة." };
    }
  }

  // الحد الأدنى للطلب (يُتجاهل لو الطلب مجاني)
  if (subtotalCents > 0 && site.minOrderCents > 0 && subtotalCents < site.minOrderCents) {
    return { error: `الحد الأدنى للطلب ${site.minOrderCents / 100} ج.م.` };
  }

  // كوبون الخصم
  const couponCode = cleanStr(formData.get("couponCode"), 30);
  let discountCents = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const cartProductIds = items.map((i) => i.productId).filter(Boolean) as string[];
    const couponResult = await validateCoupon(couponCode, mainProductSubtotalCents, userId, cartProductIds);
    if (!couponResult.valid) return { error: couponResult.error };
    discountCents = couponResult.discountCents ?? 0;
    couponId = couponResult.couponId ?? null;
  }

  const order = await createOrder({
    userId,
    customerName: name,
    customerPhone: phone,
    customerEmail: email || current?.email || null,
    address: null,
    paymentMethod: paymentMethodId || "transfer",
    proofImage,
    note: note || null,
    couponCode: couponCode || null,
    discountCents,
    taxCents: 0,
    items,
  });

  // استخدام الكوبون بعد إنشاء الطلب بنجاح
  if (couponId) await useCoupon(couponId);

  return { ok: true, orderNumber: order.orderNumber };
}
