"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createProduct, isSlugTaken } from "@/lib/products";
import { logAudit } from "@/lib/audit";

type ImportProductInput = {
  name: string;
  slug?: string;
  shortDesc?: string;
  description?: string;
  priceCents?: number;
  compareAtCents?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  images?: string[];
  fileUrl?: string;
  fileName?: string;
  featured?: boolean;
  active?: boolean;
};

export type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function importProducts(
  products: ImportProductInput[]
): Promise<ImportResult> {
  const admin = await requireAdmin();
  const result: ImportResult = { total: products.length, imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < products.length; i++) {
    const raw = products[i];
    if (!raw.name || typeof raw.name !== "string" || raw.name.trim().length < 2) {
      result.errors.push(`صف ${i + 1}: اسم المنتج غير صالح`);
      result.skipped++;
      continue;
    }

    const name = raw.name.trim();
    let slug = raw.slug ? slugify(raw.slug) : slugify(name);
    if (!slug) slug = `product-${Date.now()}-${i}`;
    if (await isSlugTaken(slug)) {
      slug = `${slug}-${Date.now()}-${i}`;
    }

    const priceCents =
      typeof raw.priceCents === "number" && raw.priceCents >= 0
        ? raw.priceCents
        : 0;

    try {
      await createProduct({
        slug,
        name,
        shortDesc: raw.shortDesc ?? null,
        description: raw.description ?? "",
        priceCents,
        compareAtCents: typeof raw.compareAtCents === "number" ? raw.compareAtCents : null,
        category: raw.category ?? "",
        subcategory: raw.subcategory ?? "",
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        images: Array.isArray(raw.images) ? raw.images : [],
        fileUrl: raw.fileUrl ?? null,
        fileName: raw.fileName ?? "",
        files: [],
        version: 1,
        maxDownloads: 0,
        relatedIds: [],
        customFields: {},
        bundleProducts: [],
        featured: raw.featured ?? false,
        active: raw.active ?? true,
      });
      result.imported++;
    } catch (e) {
      result.errors.push(`صف ${i + 1} (${name}): ${e instanceof Error ? e.message : "خطأ غير معروف"}`);
      result.skipped++;
    }
  }

  await logAudit(admin.id, "create", "product", null, {
    action: "import",
    imported: result.imported,
    skipped: result.skipped,
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
  return result;
}
