import { Suspense } from "react";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import CategoriesFilter from "@/components/CategoriesFilter";
import Pagination from "@/components/Pagination";
import { getActiveProducts, getCategories } from "@/lib/products";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { q, cat, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const [result, categories] = await Promise.all([
    getActiveProducts({
      search: q || undefined,
      category: cat || undefined,
      page: pageNum,
      perPage: 12,
    }),
    getCategories(),
  ]);

  return (
    <>
      <Hero />

      {/* ليه تشتري مننا */}
      <section id="why" className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              title="صفر عمولة"
              desc="كل جنيه من مبيعاتك يوصلك بالكامل — مفيش أي طرف تالت بياخد نسبة."
              icon="٪"
            />
            <Feature
              title="بياناتك ملكك"
              desc="كل الطلبات والعملاء متخزّنين عندك، وتحت سيطرتك الكاملة."
              icon="🔒"
            />
            <Feature
              title="دفع مرن"
              desc="كاش عند الاستلام أو تحويل محفظة/بنك مع رفع إثبات الدفع."
              icon="💳"
            />
          </div>
        </div>
      </section>

      {/* شبكة المنتجات */}
      <section id="products" className="scroll-mt-20 bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-brand-300">
              المتجر
            </span>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-extrabold text-fg sm:text-3xl">
                  <span aria-hidden="true">🛍️</span> منتجاتنا
                </h2>
                <p className="mt-1 text-muted">
                  اختار منتجك وضيفه للسلة في ثواني.
                </p>
              </div>
              <span className="tnum shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold text-brand-300">
                {result.total} منتج
              </span>
            </div>
          </div>

          {/* بحث + تصنيفات */}
          <div className="mb-6 flex flex-col gap-4">
            <Suspense>
              <SearchBar />
            </Suspense>
            {categories.length > 0 && (
              <Suspense>
                <CategoriesFilter categories={categories} />
              </Suspense>
            )}
          </div>

          <ProductGrid products={result.items} />

          <div className="mt-8">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              baseUrl="/"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-brand-600/50">
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface-2 text-2xl">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
    </div>
  );
}
