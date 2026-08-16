import Link from "next/link";
import type { ProductView } from "@/lib/products";
import { formatPrice, discountLabel } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import CompareButton from "./CompareButton";
import OptimizedImage from "./OptimizedImage";

export default function ProductCard({ product }: { product: ProductView }) {
  const img = product.images[0] ?? "/products/placeholder.svg";
  const discount = discountLabel(product.priceCents, product.compareAtCents);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:border-brand-600/60 hover:shadow-xl hover:shadow-brand-900/30">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-2"
        aria-label={product.name}
      >
        <WishlistButton productId={product.id} />
        <CompareButton productId={product.id} />
        <OptimizedImage
          src={img}
          alt={product.name}
          aspectRatio="1/1"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {discount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
              {discount}
            </span>
          )}
          {product.category && (
            <span className="rounded-full border border-line bg-bg/80 px-2.5 py-1 text-xs font-semibold text-fg backdrop-blur">
              {product.category}
            </span>
          )}
          {product.fileUrl && (
            <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300 backdrop-blur">
              تحميل فوري
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-bold leading-6 text-fg transition-colors group-hover:text-brand-300">
            {product.name}
          </h3>
        </Link>
        {product.shortDesc && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {product.shortDesc}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.priceCents === 0 ? (
              <span className="text-lg font-extrabold text-green-400">مجاني</span>
            ) : (
              <span className="tnum text-lg font-extrabold text-fg">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            )}
            {product.compareAtCents && (
              <span className="tnum text-sm text-muted line-through">
                {formatPrice(product.compareAtCents, product.currency)}
              </span>
            )}
          </div>

          <AddToCartButton product={product} variant="card" />
        </div>
      </div>
    </div>
  );
}
