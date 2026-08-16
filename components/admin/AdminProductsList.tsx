"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  deleteProductAction,
  duplicateProductAction,
  bulkDeleteProductsAction,
  bulkToggleProductsAction,
} from "@/app/actions/admin";
import { exportProductsJson, exportProductsCsv } from "@/app/actions/product-export";
import type { ProductAdminRow } from "@/lib/products";

export default function AdminProductsList({
  products,
}: {
  products: ProductAdminRow[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "true" | "false">("all");

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const subcategories = [
    ...new Set(
      products
        .filter((p) => !filterCategory || p.category === filterCategory)
        .map((p) => p.subcategory)
        .filter(Boolean)
    ),
  ];

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterSubcategory && p.subcategory !== filterSubcategory) return false;
    if (filterActive === "true" && !p.active) return false;
    if (filterActive === "false" && p.active) return false;
    return true;
  });

  const allVisibleIds = filtered.map((p) => p.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  let parseTags = (t: string): string[] => {
    try { const p = JSON.parse(t); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-fg">المنتجات ({filtered.length})</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/import"
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            استيراد
          </Link>
          <button
            type="button"
            onClick={async () => {
              const json = await exportProductsJson();
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `products-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            تصدير JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              const csv = await exportProductsCsv();
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `products-${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            تصدير CSV
          </button>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95"
          >
            + منتج جديد
          </Link>
        </div>
      </div>

      {/* فلترة وبحث */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input
          type="text"
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterSubcategory}
          onChange={(e) => setFilterSubcategory(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        >
          <option value="">كل التصنيفات الفرعية</option>
          {subcategories.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "all" | "true" | "false")}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        >
          <option value="all">الكل</option>
          <option value="true">معروض</option>
          <option value="false">مخفي</option>
        </select>
      </div>

      {/* إجراءات جماعية */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-2">
          <span className="text-sm font-bold text-fg">{selected.size} محدد</span>
          <form action={bulkDeleteProductsAction}>
            <input type="hidden" name="ids" value={JSON.stringify([...selected])} />
            <button type="submit" className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20">
              حذف المحدد
            </button>
          </form>
          <form action={bulkToggleProductsAction}>
            <input type="hidden" name="ids" value={JSON.stringify([...selected])} />
            <input type="hidden" name="field" value="active" />
            <input type="hidden" name="value" value="true" />
            <button type="submit" className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/20">
              تفعيل المحدد
            </button>
          </form>
          <form action={bulkToggleProductsAction}>
            <input type="hidden" name="ids" value={JSON.stringify([...selected])} />
            <input type="hidden" name="field" value="active" />
            <input type="hidden" name="value" value="false" />
            <button type="submit" className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-yellow-500/20">
              إخفاء المحدد
            </button>
          </form>
          <form action={bulkToggleProductsAction}>
            <input type="hidden" name="ids" value={JSON.stringify([...selected])} />
            <input type="hidden" name="field" value="featured" />
            <input type="hidden" name="value" value="true" />
            <button type="submit" className="rounded-lg bg-brand-600/10 px-3 py-1.5 text-xs font-semibold text-brand-200 hover:bg-brand-600/20">
              تمييز المحدد
            </button>
          </form>
          <form action={bulkToggleProductsAction}>
            <input type="hidden" name="ids" value={JSON.stringify([...selected])} />
            <input type="hidden" name="field" value="featured" />
            <input type="hidden" name="value" value="false" />
            <button type="submit" className="rounded-lg bg-neutral-500/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-500/20">
              إلغاء تمييز المحدد
            </button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          {products.length === 0
            ? "لسه مفيش منتجات. ابدأ بإضافة أول منتج."
            : "لا توجد نتائج تطابق البحث."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-xs text-muted">تحديد الكل</span>
          </li>
          {filtered.map((p) => {
            let tags: string[];
            try { tags = JSON.parse(p.tags); } catch { tags = []; }
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="h-4 w-4 shrink-0 accent-brand-600"
                />

                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      (() => {
                        try { const imgs = JSON.parse(p.images); return imgs[0]; } catch { return null; }
                      })() ?? "/products/placeholder.svg"
                    }
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-bold text-fg">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="tnum font-semibold text-fg">
                      {formatPrice(p.priceCents, p.currency)}
                    </span>
                    {p.category && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
                        {p.category}
                      </span>
                    )}
                    {p.subcategory && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
                        {p.subcategory}
                      </span>
                    )}
                    <span className="rounded-full bg-neutral-600/30 px-2 py-0.5 text-muted">
                      v{p.version}
                    </span>
                    <span className="tnum text-muted">
                      {p._count.orderItems} مبيعة
                    </span>
                    {p.featured && (
                      <span className="rounded-full bg-brand-600/20 px-2 py-0.5 text-brand-200">
                        مميّز
                      </span>
                    )}
                    {!p.active && (
                      <span className="rounded-full bg-neutral-600/30 px-2 py-0.5 text-muted">
                        مخفي
                      </span>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] text-muted">#{tag}</span>
                      ))}
                      {tags.length > 4 && (
                        <span className="text-[10px] text-muted">+{tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
                  >
                    تعديل
                  </Link>
                  <form action={duplicateProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
                    >
                      نسخ
                    </button>
                  </form>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      حذف
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
