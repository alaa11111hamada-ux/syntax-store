"use client";

import { useActionState, useState, useRef, useTransition } from "react";
import Image from "next/image";
import { addReviewAction, likeReviewAction, reportReviewAction, type ReviewState } from "@/app/actions/reviews";

export default function ReviewForm({
  productId,
  onDone,
  isVerifiedBuyer,
}: {
  productId: string;
  onDone?: () => void;
  isVerifiedBuyer?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addReviewAction, {} as ReviewState);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: string[] = [];
    const maxFiles = 3;
    const remaining = maxFiles - previews.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPreviews.push(ev.target?.result as string);
        if (newPreviews.length === toProcess.length) {
          setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removePreview(idx: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="images" value={JSON.stringify(previews)} />

      {isVerifiedBuyer && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          مشترى فعلاً
        </span>
      )}

      <div>
        <label className="block text-sm font-medium text-fg mb-1">التقييم</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="sr-only peer" />
              <svg className="h-8 w-8 text-muted peer-checked:text-yellow-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-fg mb-1">شارك تجربتك</label>
        <textarea
          name="comment"
          rows={4}
          maxLength={1000}
          placeholder="اكتب تجربتك بالتفصيل — إيه اللي عجبك أو ماعجبكش؟ هنفع غيرك يقرر..."
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* صور المراجعة */}
      <div>
        <label className="block text-sm font-medium text-fg mb-1">صور (اختياري - حد أقصى 3)</label>
        <div className="flex flex-wrap items-center gap-3">
          {previews.map((src, idx) => (
            <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
              <Image src={src} alt={`صورة المراجعة ${idx + 1}`} unoptimized width={80} height={80} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePreview(idx)}
                className="absolute top-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {previews.length < 3 && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 text-muted transition-colors hover:border-brand-500/40 hover:text-fg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-1 text-xs">أضف صورة</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFilesChange}
              />
            </label>
          )}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-green-400">
          تم إرسال تقييمك! هيننشر بعد المراجعة.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? "جاري الإرسال..." : "إرسال التقييم"}
      </button>
    </form>
  );
}

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      await likeReviewAction(reviewId);
    });
  }

  function handleReport() {
    startTransition(async () => {
      await reportReviewAction(reviewId, "محتوى غير مناسب");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-500/40 hover:text-brand-200 disabled:opacity-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        إعجاب
      </button>
      <button
        onClick={handleReport}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        إبلاغ
      </button>
    </div>
  );
}
