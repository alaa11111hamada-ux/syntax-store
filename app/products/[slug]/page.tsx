import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getApprovedReviews, getAverageRating } from "@/lib/reviews";
import { getCurrentUser } from "@/lib/auth";
import { hasUserPurchased } from "@/lib/reviews";
import { formatPrice, discountLabel } from "@/lib/format";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import ShareButtons from "@/components/ShareButtons";
import RelatedProducts from "@/components/RelatedProducts";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBundles from "@/components/ProductBundles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "منتج غير موجود" };
  return {
    title: product.name,
    description: product.shortDesc ?? product.description.slice(0, 150),
    openGraph: {
      title: product.name,
      description: product.shortDesc ?? undefined,
      images: product.images.length ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount = discountLabel(product.priceCents, product.compareAtCents);

  const [reviews, { avg, count }, related] = await Promise.all([
    getApprovedReviews(product.id),
    getAverageRating(product.id),
    getRelatedProducts(product.category, product.id, 4),
  ]);

  // جلب بيانات منتجات الحزمة
  let bundleProducts: { id: string; slug: string; name: string; priceCents: number; currency: string; images: string[] }[] = [];
  try {
    const bundleItems = typeof product.bundleProducts === "string"
      ? JSON.parse(product.bundleProducts)
      : product.bundleProducts;
    if (Array.isArray(bundleItems) && bundleItems.length > 0) {
      const ids = bundleItems.map((b: { productId: string }) => b.productId);
      const rows = await prisma.product.findMany({
        where: { id: { in: ids }, active: true },
        select: { id: true, slug: true, name: true, priceCents: true, currency: true, images: true },
      });
      bundleProducts = rows.map((r) => ({
        ...r,
        images: (() => { try { return JSON.parse(r.images); } catch { return []; } })(),
      }));
    }
  } catch {}

  const user = await getCurrentUser();
  const canReview = user ? await hasUserPurchased(user.id, product.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      <Breadcrumbs
        items={[
          { label: "المنتجات", href: "/#products" },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                {product.category}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                خصم {discount}
              </span>
            )}
            {product.fileUrl && (
              <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                تحميل فوري
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-snug text-fg sm:text-3xl">
            {product.name}
          </h1>

          {product.shortDesc && (
            <p className="mt-2 text-muted">{product.shortDesc}</p>
          )}

          {/* التقييم */}
          {count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <svg
                    key={n}
                    className={`h-4 w-4 ${n <= Math.round(avg) ? "text-yellow-400" : "text-muted/30"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted">({count} تقييم)</span>
            </div>
          )}

          <div className="mt-5 flex items-end gap-3">
            {product.priceCents === 0 ? (
              <span className="text-3xl font-extrabold text-green-400">مجاني</span>
            ) : (
              <span className="tnum text-3xl font-extrabold text-fg">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            )}
            {product.compareAtCents && (
              <span className="tnum pb-1 text-lg text-muted line-through">
                {formatPrice(product.compareAtCents, product.currency)}
              </span>
            )}
          </div>

          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true">⬇️</span>
            تحميل فوري بعد تأكيد الطلب.
          </p>

          <div className="my-6 h-px bg-line" />

          <AddToCartButton product={product} variant="full" />

          {/* مشاركة */}
          <div className="mt-4">
            <ShareButtons name={product.name} slug={`/products/${product.slug}`} />
          </div>

          {/* منتجات الحزمة */}
          {bundleProducts.length > 0 && (
            <ProductBundles product={product} bundleProducts={bundleProducts} />
          )}

          {product.description && (
            <div className="mt-8">
              <h2 className="mb-2 text-lg font-bold text-fg">تفاصيل المنتج</h2>
              <p className="whitespace-pre-line leading-7 text-muted">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* التقييمات */}
      <section className="mt-16">
        <h2 className="mb-6 text-xl font-extrabold text-fg">
          التقييمات ({count})
        </h2>
        <ReviewList reviews={reviews} />
        {canReview && (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-4 font-bold text-fg">اكتب تقييمك</h3>
            <ReviewForm productId={product.id} />
          </div>
        )}
        {user && !canReview && (
          <p className="mt-4 text-sm text-muted">
            هتقدر تكتب تقييم بعد ما تشترى المنتج وتستلمه.
          </p>
        )}
      </section>

      {/* منتجات تانية — سكرول أفقي */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-extrabold text-fg">
            منتجات مشابهة
          </h2>
          <RelatedProducts products={related} />
        </section>
      )}
    </div>
  );
}
