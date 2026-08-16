"use client";

import React, { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import Link from "next/link";
import type { ProductView } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { items, toggle, ready } = useWishlist();
  const { add } = useCart();

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">المفضلة</h1>
          <p className="mt-1 text-muted">{items.length} منتج في قائمة المفضلة</p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <WishlistProductsFetcher
              items={items}
              onAddAll={(products) => {
                products.forEach((p) =>
                  add({
                    productId: p.id,
                    slug: p.slug,
                    name: p.name,
                    priceCents: p.priceCents,
                    compareAtCents: p.compareAtCents,
                    currency: p.currency,
                    image: p.images[0] ?? "/products/placeholder.svg",
                  })
                );
              }}
              onRemoveAll={() => {
                items.forEach((id) => toggle(id));
              }}
            />
          </div>
        )}
      </div>

      <WishlistGrid items={items} />
    </div>
  );
}

function WishlistGrid({ items }: { items: string[] }) {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?ids=${items.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [items.join(",")]);

  if (loading) {
    return (
      <div className="mt-8 py-20 text-center text-muted">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        جاري تحميل المنتجات...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="المفضلة" className="h-16 w-16 rounded-2xl border border-line bg-surface object-contain" />
        <p className="mt-4 text-lg font-bold text-fg">المفضلة فاضية</p>
        <p className="mt-1 text-muted">ضيف منتجات من خلال زر القلب على أي منتج.</p>
        <Link
          href="/#products"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          تسوّق دلوقتي
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function WishlistProductsFetcher({
  items,
  onAddAll,
  onRemoveAll,
}: {
  items: string[];
  onAddAll: (products: ProductView[]) => void;
  onRemoveAll: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleAddAll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?ids=${items.join(",")}`);
      const data = await res.json();
      onAddAll(data.products ?? []);
    } catch {}
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAddAll}
        disabled={loading}
        className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "جاري..." : "إضافة الكل للسلة"}
      </button>
      <button
        type="button"
        onClick={onRemoveAll}
        className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
      >
        إزالة الكل
      </button>
    </>
  );
}
