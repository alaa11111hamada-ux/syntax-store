"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCompare } from "@/lib/compare";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ProductView } from "@/lib/products";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, remove, ready } = useCompare();
  const { add } = useCart();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? items;

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ids.join(",")]);

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">
        جاري التحميل...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-3xl">
          ⇄
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-fg">لا توجد منتجات للمقارنة</h1>
        <p className="mt-2 text-muted">اضغط زر "+" على أي منتج لإضافته للمقارنة.</p>
        <Link
          href="/#products"
          className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          تسوّق دلوقتي
        </Link>
      </div>
    );
  }

  const allKeys = new Set<string>();
  for (const p of products) {
    Object.keys(p.customFields).forEach((k) => allKeys.add(k));
  }
  const customKeys = Array.from(allKeys);

  const prices = products.map((p) => p.priceCents);
  const minPrice = Math.min(...prices);
  const versions = products.map((p) => p.version);
  const maxVersion = Math.max(...versions);

  function handleAddToCart(product: ProductView) {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      compareAtCents: product.compareAtCents,
      currency: product.currency,
      image: product.images[0] ?? "/products/placeholder.svg",
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Breadcrumbs items={[{ label: "المقارنة" }]} />

      <h1 className="mb-2 text-2xl font-extrabold text-fg">مقارنة المنتجات</h1>
      <p className="mb-8 text-muted">{products.length} منتجات قيد المقارنة</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="w-40 p-3 text-right text-sm font-bold text-muted">المقارنة</th>
              {products.map((p) => (
                <th key={p.id} className="p-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0] ?? "/products/placeholder.svg"}
                        alt={p.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          remove(p.id);
                          const newIds = ids.filter((id) => id !== p.id);
                          if (newIds.length > 0) {
                            router.push(`/compare?ids=${newIds.join(",")}`);
                          } else {
                            router.push("/compare");
                          }
                        }}
                        className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-red-400"
                        aria-label={`إزالة ${p.name}`}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <Link href={`/products/${p.slug}`} className="text-sm font-bold text-fg hover:text-brand-300">
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <CompareRow label="السعر">
              {products.map((p) => (
                <td key={p.id} className={`p-3 text-center tnum font-extrabold text-fg ${p.priceCents === minPrice ? "text-green-300" : ""}`}>
                  {formatPrice(p.priceCents, p.currency)}
                  {p.priceCents === minPrice && products.length > 1 && (
                    <span className="mr-1 text-xs text-green-400">★ الأفضل</span>
                  )}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="التصنيف">
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm text-fg">
                  {p.category || "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="الإصدار">
              {products.map((p) => (
                <td key={p.id} className={`p-3 text-center tnum text-sm font-bold ${p.version === maxVersion && products.length > 1 ? "text-green-300" : "text-fg"}`}>
                  v{p.version}
                  {p.version === maxVersion && products.length > 1 && (
                    <span className="mr-1 text-xs text-green-400">★ الأحدث</span>
                  )}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="الوسوم">
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm text-fg">
                  {p.tags.length > 0 ? p.tags.join("، ") : "—"}
                </td>
              ))}
            </CompareRow>
            {customKeys.map((key) => (
              <CompareRow key={key} label={key}>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center text-sm text-fg">
                    {p.customFields[key] || "—"}
                  </td>
                ))}
              </CompareRow>
            ))}
            <tr>
              <td className="p-3 text-sm font-bold text-muted">الإجراء</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className="rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95"
                  >
                    إضافة للسلة
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="p-3 text-sm font-bold text-muted">{label}</td>
      {children}
    </tr>
  );
}
