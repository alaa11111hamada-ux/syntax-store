"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { ProductView } from "@/lib/products";
import { prisma } from "@/lib/prisma";

type BundleItem = { productId: string; discountPercent: number };

type BundleProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  images: string[];
};

export default function ProductBundles({
  product,
  bundleProducts,
}: {
  product: ProductView;
  bundleProducts: BundleProduct[];
}) {
  const { add, items } = useCart();
  const [addedAll, setAddedAll] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!product.bundleProducts || product.bundleProducts.length === 0) return null;

  const bundles: BundleItem[] = (() => {
    try {
      return typeof product.bundleProducts === "string"
        ? JSON.parse(product.bundleProducts)
        : product.bundleProducts;
    } catch {
      return [];
    }
  })();

  if (bundles.length === 0) return null;

  const enriched = bundles
    .map((b) => {
      const p = bundleProducts.find((bp) => bp.id === b.productId);
      if (!p) return null;
      return { ...b, product: p };
    })
    .filter(Boolean) as (BundleItem & { product: BundleProduct })[];

  if (enriched.length === 0) return null;

  function addItem(b: BundleItem & { product: BundleProduct }) {
    const discountedPrice = Math.round(
      b.product.priceCents * (1 - b.discountPercent / 100)
    );
    add({
      productId: b.product.id,
      slug: b.product.slug,
      name: b.product.name,
      priceCents: discountedPrice,
      currency: b.product.currency || "EGP",
      image: b.product.images?.[0] ?? "/products/placeholder.svg",
    });
    setAddedIds((prev) => new Set(prev).add(b.product.id));
  }

  function addAll() {
    enriched.forEach((b) => {
      const discountedPrice = Math.round(
        b.product.priceCents * (1 - b.discountPercent / 100)
      );
      add({
        productId: b.product.id,
        slug: b.product.slug,
        name: b.product.name,
        priceCents: discountedPrice,
        currency: b.product.currency || "EGP",
        image: b.product.images?.[0] ?? "/products/placeholder.svg",
      });
    });
    setAddedAll(true);
    setAddedIds(new Set(enriched.map((e) => e.product.id)));
  }

  return (
    <section className="mt-8 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5">
      <h2 className="mb-1 text-lg font-extrabold text-fg">عروض الحزمة</h2>
      <p className="mb-4 text-sm text-muted">
        اشترِ المنتجات دي مع بعض ووفّر
      </p>

      <div className="flex flex-col gap-3">
        {enriched.map((b) => {
          const discountedPrice = Math.round(
            b.product.priceCents * (1 - b.discountPercent / 100)
          );
          const isInCart = addedIds.has(b.product.id);

          return (
            <div
              key={b.product.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
            >
              <Link
                href={`/products/${b.product.slug}`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2"
              >
                <Image
                  src={b.product.images?.[0] ?? "/products/placeholder.svg"}
                  alt={`صورة ${b.product.name}`}
                  unoptimized
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${b.product.slug}`}
                  className="line-clamp-1 text-sm font-semibold text-fg hover:text-brand-300"
                >
                  {b.product.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="tnum text-sm font-bold text-emerald-400">
                    {formatPrice(discountedPrice)}
                  </span>
                  <span className="tnum text-xs text-muted line-through">
                    {formatPrice(b.product.priceCents)}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    -{b.discountPercent}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => addItem(b)}
                disabled={isInCart}
                className="shrink-0 rounded-xl bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {isInCart ? "في السلة ✓" : "أضف"}
              </button>
            </div>
          );
        })}
      </div>

      {enriched.length > 1 && (
        <button
          type="button"
          onClick={addAll}
          disabled={addedAll}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {addedAll ? "تمت الإضافة للسلة ✓" : "أضف الحزمة للسلة"}
        </button>
      )}
    </section>
  );
}
