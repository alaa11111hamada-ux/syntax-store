"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Review = {
  id: string;
  rating: number;
  comment: string;
  images: string;
  createdAt: Date;
  user: { name: string };
};

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setModalImage(null);
  }, []);

  useEffect(() => {
    if (modalImage) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [modalImage, handleEscape]);

  if (reviews.length === 0) {
    return (
      <p className="py-8 text-center text-muted">
        لا توجد تقييمات بعد — كن أول من يقيّم المنتج!
      </p>
    );
  }

  function parseImages(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    } catch {}
    return [];
  }

  return (
    <>
      <div className="space-y-4">
        {reviews.map((r) => {
          const images = parseImages(r.images);
          return (
            <div key={r.id} className="rounded-xl border border-line bg-surface/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-fg">{r.user.name}</span>
                  <div className="flex gap-0.5" role="img" aria-label={`تقييم ${r.rating} من 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <svg
                        key={n}
                        className={`h-4 w-4 ${n <= r.rating ? "text-yellow-400" : "text-muted/30"}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <time className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                </time>
              </div>
              {r.comment && <p className="mt-2 text-sm text-fg/80">{r.comment}</p>}
              {images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalImage(src)}
                      className="h-16 w-16 overflow-hidden rounded-lg border border-line transition-opacity hover:opacity-80"
                    >
                      <Image
                        src={src}
                        alt={`صورة المراجعة ${idx + 1}`}
                        unoptimized
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* صورة بحجم كامل */}
      {modalImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-h-[85vh] max-w-3xl">
            <button
              onClick={() => setModalImage(null)}
              aria-label="إغلاق"
              className="absolute top-2 left-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <Image
              src={modalImage}
              alt="صورة المراجعة بحجم كامل"
              unoptimized
              width={768}
              height={600}
              className="max-h-[85vh] w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
