"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoriesFilter({
  categories,
}: {
  categories: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("cat") ?? "";

  if (categories.length === 0) return null;

  function select(cat: string) {
    const sp = new URLSearchParams(params.toString());
    if (cat) {
      sp.set("cat", cat);
    } else {
      sp.delete("cat");
    }
    sp.delete("page");
    router.push(`/?${sp.toString()}#products`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select("")}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          !active
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-line bg-surface text-muted hover:border-brand-500/50"
        }`}
      >
        الكل
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => select(cat)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            active === cat
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-line bg-surface text-muted hover:border-brand-500/50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
