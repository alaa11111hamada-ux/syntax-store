import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";

export type ProductFile = { name: string; url: string };

export type ProductView = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  category: string;
  subcategory: string;
  tags: string[];
  images: string[];
  fileUrl: string | null;
  fileName: string;
  files: ProductFile[];
  version: number;
  maxDownloads: number;
  downloadCount: number;
  relatedIds: string[];
  customFields: Record<string, string>;
  bundleProducts: { productId: string; discountPercent: number }[];
  featured: boolean;
  active: boolean;
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try { const p = JSON.parse(raw); return p ?? fallback; } catch { return fallback; }
}

/** يحوّل صف قاعدة البيانات لشكل جاهز للعرض */
export function toProductView(p: Product): ProductView {
  const images = safeJsonParse<string[]>(p.images, []).filter((x) => typeof x === "string");
  const tags = safeJsonParse<string[]>(p.tags, []).filter((x) => typeof x === "string");
  const files = safeJsonParse<ProductFile[]>(p.files, []).filter((x) => x && typeof x.name === "string" && typeof x.url === "string");
  const relatedIds = safeJsonParse<string[]>(p.relatedIds, []).filter((x) => typeof x === "string");
  const customFields = safeJsonParse(p.customFields, {} as Record<string, string>);
  const bundleProducts = safeJsonParse(p.bundleProducts ?? "[]", [] as { productId: string; discountPercent: number }[]).filter((x: unknown) => x && typeof x === "object" && "productId" in x && "discountPercent" in x);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    description: p.description,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    category: p.category,
    subcategory: p.subcategory,
    tags,
    images,
    fileUrl: p.fileUrl ?? null,
    fileName: p.fileName ?? "",
    files,
    version: p.version,
    maxDownloads: p.maxDownloads,
    downloadCount: p.downloadCount,
    relatedIds,
    customFields,
    bundleProducts,
    featured: p.featured,
    active: p.active,
  };
}

export type ProductInput = {
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  category: string;
  subcategory: string;
  tags: string[];
  images: string[];
  fileUrl: string | null;
  fileName: string;
  files: ProductFile[];
  version: number;
  maxDownloads: number;
  relatedIds: string[];
  customFields: Record<string, string>;
  bundleProducts: { productId: string; discountPercent: number }[];
  featured: boolean;
  active: boolean;
};

// ===== بحث وفلترة وتصنيفات =====

export type ProductFilters = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  page?: number;
  perPage?: number;
};

export type PaginatedProducts = {
  items: ProductView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** كل المنتجات المتاحة للبيع (الأحدث أولاً) مع بحث وفلترة */
export async function getActiveProducts(
  filters: ProductFilters = {}
): Promise<PaginatedProducts> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(50, Math.max(1, filters.perPage ?? 20));
  const where: Record<string, unknown> = { active: true };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { shortDesc: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.minPrice != null) {
    where.priceCents = { ...(where.priceCents as object || {}), gte: filters.minPrice };
  }
  if (filters.maxPrice != null) {
    where.priceCents = { ...(where.priceCents as object || {}), lte: filters.maxPrice };
  }

  let orderBy: Record<string, string>[];
  switch (filters.sort) {
    case "price_asc":
      orderBy = [{ priceCents: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ priceCents: "desc" }];
      break;
    case "name_asc":
      orderBy = [{ name: "asc" }];
      break;
    case "rating_desc": {
      const avgRatings = await prisma.review.groupBy({
        by: ["productId"],
        _avg: { rating: true },
      });
      const ratingMap = new Map(avgRatings.map((r) => [r.productId, r._avg.rating ?? 0]));
      const productIds = await prisma.product.findMany({
        where,
        select: { id: true },
      });
      const filteredIds = productIds
        .filter((p) => {
          const avg = ratingMap.get(p.id) ?? 0;
          return !filters.rating || avg >= filters.rating!;
        })
        .sort((a, b) => (ratingMap.get(b.id) ?? 0) - (ratingMap.get(a.id) ?? 0));
      const totalFiltered = filteredIds.length;
      const paginatedIds = filteredIds.slice((page - 1) * perPage, page * perPage);
      const rows = await prisma.product.findMany({
        where: { id: { in: paginatedIds.map((p) => p.id) } },
        select: {
          id: true, slug: true, name: true, shortDesc: true, description: true,
          priceCents: true, compareAtCents: true, currency: true, category: true,
          subcategory: true, tags: true, images: true, fileUrl: true, fileName: true,
          files: true, version: true, maxDownloads: true, downloadCount: true,
          relatedIds: true, customFields: true, bundleProducts: true,
          featured: true, active: true, createdAt: true, updatedAt: true,
        },
      });
      const ordered = paginatedIds.map((pid) => rows.find((r) => r.id === pid.id)).filter(Boolean) as typeof rows;
      return {
        items: ordered.map(toProductView),
        total: totalFiltered,
        page,
        perPage,
        totalPages: Math.ceil(totalFiltered / perPage),
      };
    }
    default:
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, slug: true, name: true, shortDesc: true, description: true,
        priceCents: true, compareAtCents: true, currency: true, category: true,
        subcategory: true, tags: true, images: true, fileUrl: true, fileName: true,
        files: true, version: true, maxDownloads: true, downloadCount: true,
        relatedIds: true, customFields: true, bundleProducts: true,
        featured: true, active: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map(toProductView),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/** كل التصنيفات المتاحة */
export async function getCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, category: { not: "" } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

/** المنتجات المميزة لصفحة الهبوط */
export async function getFeaturedProducts(limit = 6): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toProductView);
}

/** منتج واحد معروض للبيع بالـ slug (لصفحة المنتج) */
export async function getProductBySlug(
  slug: string
): Promise<ProductView | null> {
  const row = await prisma.product.findFirst({
    where: { slug, active: true },
    select: {
      id: true, slug: true, name: true, shortDesc: true, description: true,
      priceCents: true, compareAtCents: true, currency: true, category: true,
      subcategory: true, tags: true, images: true, fileUrl: true, fileName: true,
      files: true, version: true, maxDownloads: true, downloadCount: true,
      relatedIds: true, customFields: true, bundleProducts: true,
      featured: true, active: true, createdAt: true, updatedAt: true,
    },
  });
  return row ? toProductView(row) : null;
}

/** منتجات مشابهة (نفس التصنيف) */
export async function getRelatedProducts(
  category: string,
  currentId: string,
  limit = 4
): Promise<ProductView[]> {
  if (!category) return [];
  const rows = await prisma.product.findMany({
    where: { active: true, category, id: { not: currentId } },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProductView);
}

// ===== أدمن (كل المنتجات بما فيها غير المعروضة) =====
export type ProductAdminRow = Product & {
  _count: { orderItems: number };
};

export async function getAllProductsAdmin(): Promise<ProductAdminRow[]> {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orderItems: true } } },
  });
  return rows;
}

export async function getProductByIdAdmin(
  id: string
): Promise<ProductView | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? toProductView(row) : null;
}

function serializeProductInput(input: ProductInput) {
  return {
    ...input,
    images: JSON.stringify(input.images),
    tags: JSON.stringify(input.tags),
    files: JSON.stringify(input.files),
    relatedIds: JSON.stringify(input.relatedIds),
    customFields: JSON.stringify(input.customFields),
    bundleProducts: JSON.stringify(input.bundleProducts),
  };
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({
    data: serializeProductInput(input),
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  return prisma.product.update({
    where: { id },
    data: serializeProductInput(input),
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

/** يتأكد إن الـ slug فريد (باستثناء منتج معيّن عند التعديل) */
export async function isSlugTaken(
  slug: string,
  exceptId?: string
): Promise<boolean> {
  const row = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  return !!row && row.id !== exceptId;
}
