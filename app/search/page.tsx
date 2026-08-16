import type { Metadata } from "next";
import { Suspense } from "react";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import SearchFilters from "@/components/SearchFilters";
import { getActiveProducts, getCategories } from "@/lib/products";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `نتائج بحث: ${q}` : "البحث عن المنتجات",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, cat, minPrice, maxPrice, rating, sort } = await searchParams;
  const categories = await getCategories();

  const result = await getActiveProducts({
    search: q || undefined,
    category: cat || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    rating: rating ? Number(rating) : undefined,
    sort: sort || undefined,
    perPage: 30,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ label: "البحث" }]} />

      {/* عنوان */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-fg sm:text-3xl">
          {q ? (
            <>
              نتائج البحث عن: <span className="text-brand-400">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            "البحث عن المنتجات"
          )}
        </h1>
        <p className="mt-2 text-muted">{result.total} نتيجة</p>
      </div>

      <div className="flex gap-6">
        {/* فلاتر البحث */}
        <div className="hidden w-56 shrink-0 md:block">
          <Suspense>
            <SearchFilters
              categories={categories}
              initialCat={cat}
              initialMin={minPrice}
              initialMax={maxPrice}
              initialRating={rating}
              initialSort={sort}
            />
          </Suspense>
        </div>

        {/* فلتر الموبايل */}
        <div className="md:hidden">
          <Suspense>
            <SearchFilters
              categories={categories}
              initialCat={cat}
              initialMin={minPrice}
              initialMax={maxPrice}
              initialRating={rating}
              initialSort={sort}
            />
          </Suspense>
        </div>

        {/* النتائج */}
        <div className="min-w-0 flex-1">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface-2">
                <svg className="h-7 w-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-fg">لا توجد نتائج</h3>
              <p className="mt-2 text-sm text-muted">
                {q
                  ? `ما لقيناش نتائج لكلمة "${q}". جرّب كلمات بحث تانية.`
                  : "اكتب كلمة في صندوق البحث عشان تلاقي المنتجات."}
              </p>
              <a
                href="/"
                className="mt-6 inline-block rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
              >
                العودة للمتجر
              </a>
            </div>
          ) : (
            <ProductGrid products={result.items} />
          )}
        </div>
      </div>
    </div>
  );
}
