"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Props = {
  categories: string[];
  initialCat?: string;
  initialMin?: string;
  initialMax?: string;
  initialRating?: string;
  initialSort?: string;
};

const SORT_OPTIONS = [
  { value: "", label: "الأحدث أولاً" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
  { value: "name_asc", label: "الاسم: أ - ي" },
  { value: "rating_desc", label: "الأعلى تقييماً" },
];

const RATING_OPTIONS = [
  { value: "4", label: "4 نجوم فأكثر" },
  { value: "3", label: "3 نجوم فأكثر" },
  { value: "2", label: "2 نجوم فأكثر" },
];

export default function SearchFilters({
  categories,
  initialCat,
  initialMin,
  initialMax,
  initialRating,
  initialSort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(initialMin ?? "");
  const [maxPrice, setMaxPrice] = useState(initialMax ?? "");
  const [rating, setRating] = useState(initialRating ?? "");
  const [sort, setSort] = useState(initialSort ?? "");
  const [cat, setCat] = useState(initialCat ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("cat", cat);
    else params.delete("cat");
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    if (rating) params.set("rating", rating);
    else params.delete("rating");
    if (sort) params.set("sort", sort);
    else params.delete("sort");
    params.delete("page");
    router.push(`/search?${params.toString()}`);
    setMobileOpen(false);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cat");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("rating");
    params.delete("sort");
    params.delete("page");
    router.push(`/search?${params.toString()}`);
    setMinPrice("");
    setMaxPrice("");
    setRating("");
    setSort("");
    setCat("");
    setMobileOpen(false);
  }

  const hasFilters = cat || minPrice || maxPrice || rating || sort;

  return (
    <>
      {/* زر فلتر الموبايل */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg md:hidden"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        الفلاتر
        {hasFilters && (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] text-white">
            !
          </span>
        )}
      </button>

      {/* الفلتر الجانبي */}
      <aside
        className={`${mobileOpen ? "block" : "hidden"} md:block`}
      >
        <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-4">
          {/* التصنيفات */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-fg">التصنيفات</h3>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => { setCat(""); }}
                  className={`block w-full text-right rounded-lg px-3 py-2 text-sm transition-colors ${
                    !cat ? "bg-brand-500/10 font-semibold text-brand-400" : "text-muted hover:text-fg"
                  }`}
                >
                  الكل
                </button>
              </li>
              {categories.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => { setCat(c); }}
                    className={`block w-full text-right rounded-lg px-3 py-2 text-sm transition-colors ${
                      cat === c ? "bg-brand-500/10 font-semibold text-brand-400" : "text-muted hover:text-fg"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* نطاق السعر */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-fg">نطاق السعر</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="من"
                min={0}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
              />
              <span className="text-muted">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="إلى"
                min={0}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* التقييم */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-fg">التقييم</h3>
            <div className="flex flex-col gap-1">
              {RATING_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-fg"
                >
                  <input
                    type="radio"
                    name="rating-filter"
                    checked={rating === opt.value}
                    onChange={() => setRating(rating === opt.value ? "" : opt.value)}
                    className="accent-brand-600"
                  />
                  <span className="flex items-center gap-1">
                    {Array.from({ length: Number(opt.value) }).map((_, i) => (
                      <svg key={i} className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ms-1">{opt.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* الترتيب */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-fg">ترتيب حسب</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* أزرار */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
            >
              تطبيق الفلاتر
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-fg"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
