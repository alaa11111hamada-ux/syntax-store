"use client";

import { useRef, useState } from "react";

type BundleItem = { productId: string; discountPercent: number };

export default function BundleEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: BundleItem[];
}) {
  const [items, setItems] = useState<BundleItem[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; priceCents: number }[]>([]);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const sync = (next: BundleItem[]) => {
    setItems(next);
    if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(next);
  };

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(
      `/api/admin/products/search?q=${encodeURIComponent(q)}`
    );
    if (res.ok) {
      const data = await res.json();
      const existingIds = new Set(items.map((i) => i.productId));
      setResults(
        data.filter(
          (p: { id: string }) => !existingIds.has(p.id)
        )
      );
    }
  };

  const addItem = (p: { id: string; name: string }) => {
    sync([...items, { productId: p.id, discountPercent: 10 }]);
    setQuery("");
    setResults([]);
  };

  const removeItem = (idx: number) =>
    sync(items.filter((_, i) => i !== idx));

  const updateDiscount = (idx: number, value: number) => {
    const clamped = Math.min(90, Math.max(1, value));
    sync(
      items.map((item, i) =>
        i === idx ? { ...item, discountPercent: clamped } : item
      )
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg">منتجات الحزمة</h3>
        <span className="text-xs text-muted">
          اشترِ هذا المنتج + هذه المنتجات بخصم
        </span>
      </div>
      <input
        type="hidden"
        name={name}
        ref={hiddenRef}
        defaultValue={JSON.stringify(defaultValue)}
      />

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="ابحث عن منتج لإضافته للحزمة..."
          className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-line bg-surface shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addItem(p)}
                  className="w-full px-3 py-2 text-right text-sm text-fg hover:bg-surface-2"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length === 0 && (
        <p className="mt-2 text-xs text-muted">
          لا توجد منتجات في الحزمة بعد.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-fg">
              {item.productId}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={90}
                value={item.discountPercent}
                onChange={(e) =>
                  updateDiscount(idx, parseInt(e.target.value) || 1)
                }
                className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-center text-sm text-fg outline-none focus:border-brand-500"
              />
              <span className="text-xs text-muted">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="shrink-0 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
