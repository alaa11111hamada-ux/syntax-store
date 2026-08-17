"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { saveImage, saveDigitalFile } from "@/lib/upload";
import { updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  isSlugTaken,
  type ProductInput,
  type ProductFile,
} from "@/lib/products";
import { cleanStr, isNonEmpty } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ===== الطلبات =====
export async function setOrderStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("orderId"), 40);
  const status = cleanStr(formData.get("status"), 20);
  if (!id || !ORDER_STATUSES.includes(status as OrderStatus)) return;
  await updateOrderStatus(id, status as OrderStatus);

  await logAudit(admin.id, "status_change", "order", id, { status });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

// ===== تعليقات الطلب =====
export async function addOrderCommentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const orderId = cleanStr(formData.get("orderId"), 40);
  const content = cleanStr(formData.get("content"), 2000);
  const visible = formData.get("visible") === "on";
  if (!orderId || !content) return;

  await prisma.orderComment.create({
    data: {
      orderId,
      userId: admin.id,
      content,
      visible,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function editOrderCommentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const commentId = cleanStr(formData.get("commentId"), 40);
  const content = cleanStr(formData.get("content"), 2000);
  if (!commentId || !content) return;

  const comment = await prisma.orderComment.findUnique({ where: { id: commentId } });
  if (!comment) return;

  await prisma.orderComment.update({
    where: { id: commentId },
    data: { content },
  });

  revalidatePath(`/admin/orders/${comment.orderId}`);
}

export async function deleteOrderCommentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const commentId = cleanStr(formData.get("commentId"), 40);
  const orderId = cleanStr(formData.get("orderId"), 40);
  if (!commentId) return;

  await prisma.orderComment.delete({ where: { id: commentId } });

  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
}

// ===== المنتجات =====
export type ProductFormState = { error?: string };

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function egpToCents(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseJsonArray(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
  } catch {}
  return [];
}

function parseJsonFileArray(v: FormDataEntryValue | null): ProductFile[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed))
      return parsed.filter(
        (x) => x && typeof x.name === "string" && typeof x.url === "string"
      );
  } catch {}
  return [];
}

function parseJsonMap(v: FormDataEntryValue | null): Record<string, string> {
  if (typeof v !== "string") return {};
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {}
  return {};
}

async function parseProductForm(
  formData: FormData,
  exceptId?: string
): Promise<{ data?: ProductInput; error?: string }> {
  const name = cleanStr(formData.get("name"), 120);
  if (!isNonEmpty(name, 2)) return { error: "اكتب اسم المنتج." };

  let slug = cleanStr(formData.get("slug"), 80);
  if (!slug) slug = slugify(name);
  else slug = slugify(slug);
  if (!slug) return { error: "الـ slug غير صالح، جرّب اسم تاني." };
  if (await isSlugTaken(slug, exceptId))
    return { error: `الـ slug "${slug}" مستخدم بالفعل، غيّره.` };

  const priceCents = egpToCents(cleanStr(formData.get("price"), 20));
  if (priceCents === null) return { error: "السعر غير صحيح." };

  const compareRaw = cleanStr(formData.get("compareAt"), 20);
  const compareAtCents = compareRaw ? egpToCents(compareRaw) : null;
  if (compareRaw && compareAtCents === null)
    return { error: "السعر قبل الخصم غير صحيح." };

  const category = cleanStr(formData.get("category"), 80);
  const subcategory = cleanStr(formData.get("subcategory"), 80);
  const shortDesc = cleanStr(formData.get("shortDesc"), 160) || null;
  const description = cleanStr(formData.get("description"), 4000);
  const featured = formData.get("featured") === "on";
  const active = formData.get("active") === "on";

  // الوسوم
  const tags = parseJsonArray(formData.get("tags"));

  // الصور: رابط لكل سطر + صور مرفوعة (اختياري)
  const urls = cleanStr(formData.get("imageUrls"), 4000)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const images: string[] = [];
  const uploadedImages = formData.getAll("images");
  for (const img of uploadedImages) {
    if (img instanceof File && img.size > 0) {
      try {
        images.push(await saveImage(img, "products"));
      } catch (e) {
        return { error: e instanceof Error ? e.message : "فشل رفع الصورة." };
      }
    }
  }
  images.push(...urls);

  // الملف الرقمي الرئيسي
  let fileUrl = cleanStr(formData.get("fileUrl"), 500) || null;
  const fileName = cleanStr(formData.get("fileName"), 200) || "";
  const digitalFile = formData.get("file");
  if (digitalFile instanceof File && digitalFile.size > 0) {
    try {
      fileUrl = await saveDigitalFile(digitalFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "فشل رفع الملف." };
    }
  }

  // ملفات إضافية
  let files = parseJsonFileArray(formData.get("files"));

  // إصدار الملف — يزيد تلقائيًّا لو الملف الرئيسي اتغيّر
  let version = parseInt(cleanStr(formData.get("version"), 10), 10) || 1;
  if (digitalFile instanceof File && digitalFile.size > 0 && exceptId) {
    const existing = await prisma.product.findUnique({ where: { id: exceptId }, select: { version: true } });
    if (existing) version = existing.version + 1;
  }

  // حد أقصى للتحميل
  const maxDownloads = parseInt(cleanStr(formData.get("maxDownloads"), 10), 10) || 0;

  // منتجات مشابهة
  const relatedIds = parseJsonArray(formData.get("relatedIds"));

  // حقول مخصصة
  const customFields = parseJsonMap(formData.get("customFields"));

  // منتجات الحزمة
  let bundleProducts: { productId: string; discountPercent: number }[] = [];
  try {
    const parsed = JSON.parse(typeof formData.get("bundleProducts") === "string" ? (formData.get("bundleProducts") as string) : "[]");
    if (Array.isArray(parsed)) bundleProducts = parsed;
  } catch {}

  return {
    data: {
      slug,
      name,
      shortDesc,
      description,
      priceCents,
      compareAtCents,
      category,
      subcategory,
      tags,
      images,
      fileUrl,
      fileName,
      files,
      version,
      maxDownloads,
      relatedIds,
      customFields,
      bundleProducts,
      featured,
      active,
    },
  };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  try {
    const admin = await requireAdmin();
    const { data, error } = await parseProductForm(formData);
    if (error || !data) return { error };
    const product = await createProduct(data);
    await logAudit(admin.id, "create", "product", product.id, { name: data.name });
    revalidatePath("/admin/products");
    revalidatePath("/");
    redirect("/admin/products");
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "حدث خطأ غير متوقع" };
  }
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  try {
    const admin = await requireAdmin();
    const id = cleanStr(formData.get("id"), 40);
    if (!id) return { error: "منتج غير معروف." };
    const { data, error } = await parseProductForm(formData, id);
    if (error || !data) return { error };
    await updateProduct(id, data);
    await logAudit(admin.id, "update", "product", id, { name: data.name });
    revalidatePath("/admin/products");
    revalidatePath(`/products/${data.slug}`);
    revalidatePath("/");
    redirect("/admin/products");
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "حدث خطأ غير متوقع" };
  }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (id) {
    await deleteProduct(id);
    await logAudit(admin.id, "delete", "product", id);
    revalidatePath("/admin/products");
    revalidatePath("/");
  }
}

// ===== نسخ منتج =====
export async function duplicateProductAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = cleanStr(formData.get("id"), 40);
  if (!id) return;

  const original = await prisma.product.findUnique({ where: { id } });
  if (!original) return;

  const newName = original.name + " (نسخة)";
  let newSlug = slugify(newName);
  if (await isSlugTaken(newSlug)) {
    newSlug = newSlug + "-" + Date.now();
  }

  await prisma.product.create({
    data: {
      slug: newSlug,
      name: newName,
      shortDesc: original.shortDesc,
      description: original.description,
      priceCents: original.priceCents,
      compareAtCents: original.compareAtCents,
      currency: original.currency,
      category: original.category,
      subcategory: original.subcategory,
      tags: original.tags,
      images: original.images,
      fileUrl: original.fileUrl,
      fileName: original.fileName,
      files: original.files,
      version: original.version,
      maxDownloads: original.maxDownloads,
      relatedIds: original.relatedIds,
      customFields: original.customFields,
      bundleProducts: original.bundleProducts,
      featured: false,
      active: false,
    },
  });

  await logAudit(admin.id, "create", "product", null, { name: newName, duplicatedFrom: id });
  revalidatePath("/admin/products");
}

// ===== إجراءات جماعية =====
export async function bulkDeleteProductsAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ids = parseJsonArray(formData.get("ids"));
  if (ids.length === 0) return;

  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await logAudit(admin.id, "delete", "product", null, { bulk: ids.length });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function bulkToggleProductsAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ids = parseJsonArray(formData.get("ids"));
  const field = cleanStr(formData.get("field"), 20);
  const value = formData.get("value") === "true";
  if (ids.length === 0 || !["active", "featured"].includes(field)) return;

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { [field]: value },
  });
  await logAudit(admin.id, "update", "product", null, { bulk: ids.length, field, value });
  revalidatePath("/admin/products");
}
