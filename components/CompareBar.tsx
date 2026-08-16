"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCompare } from "@/lib/compare";
import type { ProductView } from "@/lib/products";

export default function CompareBar() {
  const { items, remove, clear, ready } = useCompare();
  const [products, setProducts] = useState<ProductView[]>([]);

  useEffect(() => {
    if (!ready || items.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/products?ids=${items.join(",")}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]));
  }, [items, ready]);

  if (!ready || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-surface/95 backdrop-blur-xl shadow-2xl shadow-black/30 pb-safe">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
        <span className="text-sm font-bold text-fg">المقارنة ({items.length}/3)</span>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {products.map((p) => (
            <div key={p.id} className="relative flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
              <Image
                src={p.images[0] ?? "/products/placeholder.svg"}
                alt={`صورة ${p.name}`}
                unoptimized
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
              />
              <span className="max-w-[100px] truncate text-xs font-semibold text-fg">{p.name}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ms-1 text-muted transition-colors hover:text-red-400"
                aria-label={`إزالة ${p.name} من المقارنة`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-xs font-semibold text-muted transition-colors hover:text-red-400"
        >
          مسح الكل
        </button>
        <Link
          href={`/compare?ids=${items.join(",")}`}
          className="shrink-0 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95"
        >
          مقارنة
        </Link>
      </div>
    </div>
  );
}
