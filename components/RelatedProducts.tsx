"use client";

import { useRef } from "react";
import type { ProductView } from "@/lib/products";
import ProductCard from "./ProductCard";

type Props = {
  products: ProductView[];
};

export default function RelatedProducts({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: dir === "left" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[240px] shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/3 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface shadow-lg transition-colors hover:bg-surface-2"
            aria-label="السابق"
          >
            <svg className="h-4 w-4 text-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/3 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface shadow-lg transition-colors hover:bg-surface-2"
            aria-label="التالي"
          >
            <svg className="h-4 w-4 text-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
