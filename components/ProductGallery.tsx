"use client";

import { useState } from "react";
import Image from "next/image";
import OptimizedImage from "./OptimizedImage";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const list = images.length > 0 ? images : ["/products/placeholder.svg"];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* الصورة الرئيسية */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
        <OptimizedImage
          src={list[active]}
          alt={alt}
          aspectRatio="1/1"
          className="h-full w-full object-cover"
        />
      </div>

      {/* الصور المصغّرة */}
      {list.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`صورة ${i + 1}`}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                i === active
                  ? "border-brand-500"
                  : "border-line hover:border-brand-600/50"
              }`}
            >
              <Image src={src} alt={`صورة مصغرة ${i + 1}`} unoptimized width={80} height={80} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
