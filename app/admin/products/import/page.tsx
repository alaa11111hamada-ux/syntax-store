"use client";

import { useState, useRef } from "react";
import { importProducts, type ImportResult } from "@/app/actions/product-import";
import { formatPrice } from "@/lib/format";

type PreviewItem = {
  name: string;
  slug?: string;
  priceCents?: number;
  category?: string;
  active?: boolean;
};

export default function ProductImportPage() {
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [rawData, setRawData] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const items: PreviewItem[] = arr.map((item: Record<string, unknown>) => ({
          name: String(item.name ?? ""),
          slug: typeof item.slug === "string" ? item.slug : undefined,
          priceCents: typeof item.priceCents === "number" ? item.priceCents : typeof item.price === "number" ? Math.round(item.price * 100) : undefined,
          category: typeof item.category === "string" ? item.category : undefined,
          active: typeof item.active === "boolean" ? item.active : undefined,
        }));
        setRawData(arr);
        setPreview(items);
      } catch {
        setError("ملف JSON غير صالح. تأكد من صيغة الملف.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!rawData || !Array.isArray(rawData)) return;
    setLoading(true);
    try {
      const res = await importProducts(
        rawData.map((item: Record<string, unknown>) => ({
          name: String(item.name ?? ""),
          slug: typeof item.slug === "string" ? item.slug : undefined,
          shortDesc: typeof item.shortDesc === "string" ? item.shortDesc : undefined,
          description: typeof item.description === "string" ? item.description : undefined,
          priceCents: typeof item.priceCents === "number" ? item.priceCents : typeof item.price === "number" ? Math.round(item.price * 100) : 0,
          compareAtCents: typeof item.compareAtCents === "number" ? item.compareAtCents : undefined,
          currency: typeof item.currency === "string" ? item.currency : undefined,
          category: typeof item.category === "string" ? item.category : undefined,
          subcategory: typeof item.subcategory === "string" ? item.subcategory : undefined,
          tags: Array.isArray(item.tags) ? item.tags : undefined,
          images: Array.isArray(item.images) ? item.images : undefined,
          fileUrl: typeof item.fileUrl === "string" ? item.fileUrl : undefined,
          featured: typeof item.featured === "boolean" ? item.featured : undefined,
          active: typeof item.active === "boolean" ? item.active : undefined,
        }))
      );
      setResult(res);
      if (res.imported > 0) {
        setPreview([]);
        setRawData(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء الاستيراد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-extrabold text-fg">استيراد المنتجات</h2>
        <p className="mt-1 text-sm text-muted">
          ارفع ملف JSON يحتوي على مصفوفة من المنتجات. كل منتج يجب أن يحتوي على الاسم على الأقل.
        </p>
      </div>

      {/* رفع الملف */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <label className="block text-sm font-semibold text-fg">اختر ملف JSON</label>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-muted file:ml-0 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-opacity hover:file:opacity-90"
        />
        <p className="mt-2 text-xs text-muted">
          الصيغة المتوقعة: [{"{"} "name": "..."{", "}priceCents": 50000{", "}category": "..."{"}"}]
        </p>
      </section>

      {/* رسالة خطأ */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* نتيجة الاستيراد */}
      {result && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold text-fg">نتيجة الاستيراد</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-bg p-3 text-center">
              <p className="tnum text-2xl font-extrabold text-fg">{result.total}</p>
              <p className="text-xs text-muted">الإجمالي</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center">
              <p className="tnum text-2xl font-extrabold text-green-300">{result.imported}</p>
              <p className="text-xs text-muted">تم الاستيراد</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="tnum text-2xl font-extrabold text-amber-300">{result.skipped}</p>
              <p className="text-xs text-muted">تم التخطي</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {result.errors.map((err, i) => (
                <li key={i} className="text-xs text-red-400">{err}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* جدول المعاينة */}
      {preview.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-fg">
              معاينة ({preview.length} منتج)
            </h3>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "جارٍ الاستيراد..." : "تأكيد الاستيراد"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-muted">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">الاسم</th>
                  <th className="px-3 py-2">الـ Slug</th>
                  <th className="px-3 py-2">السعر</th>
                  <th className="px-3 py-2">التصنيف</th>
                  <th className="px-3 py-2">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.map((item, i) => (
                  <tr key={i} className="text-fg">
                    <td className="tnum px-3 py-2 text-xs text-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold">{item.name || <span className="text-red-400">—</span>}</td>
                    <td className="tnum px-3 py-2 text-xs text-muted">{item.slug || "—"}</td>
                    <td className="tnum px-3 py-2">
                      {typeof item.priceCents === "number" ? formatPrice(item.priceCents) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{item.category || "—"}</td>
                    <td className="px-3 py-2">
                      {item.active === false ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">غير مفعّل</span>
                      ) : (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-300">مفعّل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
