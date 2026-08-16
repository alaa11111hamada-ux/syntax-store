"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductView } from "@/lib/products";
import type { ProductFormState } from "@/app/actions/admin";
import BundleEditor from "./BundleEditor";

type Action = (
  prev: ProductFormState,
  formData: FormData
) => Promise<ProductFormState>;

const initial: ProductFormState = {};

export default function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: Action;
  product?: ProductView;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const priceEGP = product ? (product.priceCents / 100).toString() : "";
  const compareEGP =
    product?.compareAtCents != null
      ? (product.compareAtCents / 100).toString()
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="اسم المنتج" name="name" defaultValue={product?.name} required />
        <Field
          label="الرابط (slug) — اختياري"
          name="slug"
          defaultValue={product?.slug}
          placeholder="هيتولّد من الاسم لو سبته فاضي"
        />
        <Field
          label="السعر (ج.م)"
          name="price"
          type="number"
          step="0.01"
          defaultValue={priceEGP}
          required
        />
        <Field
          label="السعر قبل الخصم (اختياري)"
          name="compareAt"
          type="number"
          step="0.01"
          defaultValue={compareEGP}
        />
        <Field
          label="التصنيف"
          name="category"
          defaultValue={product?.category ?? ""}
          placeholder="مثلاً: كورسات، كتب، ملفات"
        />
        <Field
          label="التصنيف الفرعي"
          name="subcategory"
          defaultValue={product?.subcategory ?? ""}
          placeholder="مثلاً: تصميم، برمجة، تسويق"
        />
        <Field
          label="وصف مختصر (يظهر في الكارت)"
          name="shortDesc"
          defaultValue={product?.shortDesc ?? ""}
        />
      </div>

      {/* الوسوم */}
      <TagsInput
        name="tags"
        defaultValue={product?.tags ?? []}
      />

      <div>
        <label className="block text-sm text-muted" htmlFor="description">
          الوصف الكامل
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
      </div>

      {/* الملف الرقمي الرئيسي */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
        <h3 className="mb-3 text-sm font-bold text-fg">الملف الرقمي الرئيسي</h3>
        <Field
          label="اسم الملف الظاهر للعميل (اختياري — لو فاضي هيتاخد من اسم المنتج)"
          name="fileName"
          defaultValue={product?.fileName ?? ""}
          placeholder="مثال: ملف الدورة التعليمية كاملة"
        />
        <Field
          label="رابط الملف (اختياري — للتحديث لاحقاً)"
          name="fileUrl"
          defaultValue={product?.fileUrl ?? ""}
          placeholder="https://example.com/file.pdf أو /uploads/files/file.zip"
        />
        <label className="mt-3 block text-sm text-muted" htmlFor="file">
          أو ارفع ملف (PDF, ZIP, MP4...)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.zip,.rar,.mp4,.mp3,.doc,.docx,.pptx,.xlsx"
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-700"
        />
        {product?.fileUrl && (
          <p className="mt-2 text-xs text-green-400">
            الملف الحالي: {product.fileUrl}
          </p>
        )}
      </div>

      {/* ملفات إضافية */}
      <FilesSection
        name="files"
        defaultValue={product?.files ?? []}
      />

      {/* إعدادات التحميل */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="mb-3 text-sm font-bold text-fg">إعدادات التحميل</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="إصدار الملف"
            name="version"
            type="number"
            defaultValue={String(product?.version ?? 1)}
            placeholder="1"
          />
          <Field
            label="حد أقصى للتحميل (0 = غير محدود)"
            name="maxDownloads"
            type="number"
            defaultValue={String(product?.maxDownloads ?? 0)}
            placeholder="0"
          />
          <div>
            <span className="block text-sm text-muted">عدد التحميلات</span>
            <p className="mt-1 text-lg font-bold text-fg">{product?.downloadCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* الصور */}
      <div>
        <label className="block text-sm text-muted" htmlFor="imageUrls">
          روابط الصور (رابط في كل سطر)
        </label>
        <textarea
          id="imageUrls"
          name="imageUrls"
          rows={3}
          defaultValue={product?.images.join("\n")}
          placeholder="/products/example.svg"
          className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
        <label className="mt-3 block text-sm text-muted" htmlFor="images">
          أو ارفع صور (تتضاف للروابط — يمكن اختيار أكثر من صورة)
        </label>
        <input
          id="images"
          name="images"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-700"
        />
        {product?.images && product.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {product.images.map((img, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
                <Image src={img} alt={`صورة المنتج ${i + 1}`} unoptimized width={64} height={64} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* منتجات مشابهة */}
      <RelatedProductsSection
        name="relatedIds"
        defaultValue={product?.relatedIds ?? []}
      />

      {/* منتجات الحزمة */}
      <BundleEditor
        name="bundleProducts"
        defaultValue={product?.bundleProducts ?? []}
      />

      {/* حقول مخصصة */}
      <CustomFieldsSection
        name="customFields"
        defaultValue={product?.customFields ?? {}}
      />

      {/* خيارات */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product ? product.featured : false}
            className="h-4 w-4 accent-brand-600"
          />
          مميّز (يظهر في الواجهة)
        </label>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product ? product.active : true}
            className="h-4 w-4 accent-brand-600"
          />
          معروض للبيع
        </label>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isPending ? "بيتحفظ…" : submitLabel}
        </button>
        <Link
          href="/admin/products"
          className="rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-fg transition-colors hover:bg-surface-2"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-muted" htmlFor={name}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
      />
    </div>
  );
}

function TagsInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string[];
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [input, setInput] = useState("");
  const hiddenRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const t = value.trim();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(next);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(next);
  };

  return (
    <div>
      <span className="block text-sm text-muted">الوسوم (كل وسم بالenter)</span>
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={JSON.stringify(defaultValue)} />
      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand-600/20 px-2.5 py-0.5 text-xs font-semibold text-brand-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-brand-400 hover:text-brand-200"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={tags.length === 0 ? "أضف وسوم..." : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-fg outline-none"
        />
      </div>
    </div>
  );
}

function FilesSection({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: { name: string; url: string }[];
}) {
  const [files, setFiles] = useState<{ name: string; url: string }[]>(defaultValue);
  const [uploading, setUploading] = useState(false);

  const updateField = (idx: number, field: "name" | "url", value: string) => {
    setFiles(files.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  const addFile = () => setFiles([...files, { name: "", url: "" }]);
  const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { name: string; url: string }[] = [];
      for (const file of Array.from(selected)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/file", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({ name: file.name, url: data.url });
        }
      }
      setFiles((prev) => [...prev, ...uploaded]);
    } catch {
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg">ملفات إضافية</h3>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-200 hover:bg-green-600/30">
            {uploading ? "بيتحمّل…" : "رفع ملفات"}
            <input
              type="file"
              multiple
              accept=".pdf,.zip,.rar,.mp4,.mp3,.doc,.docx,.pptx,.xlsx"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          <button
            type="button"
            onClick={addFile}
            className="rounded-lg bg-brand-600/20 px-3 py-1 text-xs font-semibold text-brand-200 hover:bg-brand-600/30"
          >
            + إضافة رابط
          </button>
        </div>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(files)} />
      {files.length === 0 && (
        <p className="text-xs text-muted">لا توجد ملفات إضافية.</p>
      )}
      <div className="flex flex-col gap-2">
        {files.map((f, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="اسم الملف"
              value={f.name}
              onChange={(e) => updateField(idx, "name", e.target.value)}
              className="w-1/3 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-brand-500"
            />
            <input
              type="text"
              placeholder="رابط الملف"
              value={f.url}
              onChange={(e) => updateField(idx, "url", e.target.value)}
              className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => removeFile(idx)}
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

function RelatedProductsSection({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string[];
}) {
  const [ids, setIds] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const sync = (next: string[]) => {
    setIds(next);
    if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(next);
  };

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.filter((p: { id: string }) => !ids.includes(p.id)));
    }
  };

  const addId = (id: string) => {
    sync([...ids, id]);
    setQuery("");
    setResults([]);
  };

  const removeId = (id: string) => sync(ids.filter((i) => i !== id));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-3 text-sm font-bold text-fg">منتجات مشابهة</h3>
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={JSON.stringify(defaultValue)} />
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-line bg-surface shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addId(p.id)}
                  className="w-full px-3 py-2 text-right text-sm text-fg hover:bg-surface-2"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {ids.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted"
            >
              <span className="max-w-[120px] truncate">{id}</span>
              <button type="button" onClick={() => removeId(id)} className="text-red-400 hover:text-red-300">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomFieldsSection({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: Record<string, string>;
}) {
  const [fields, setFields] = useState<[string, string][]>(
    Object.entries(defaultValue)
  );
  const hiddenRef = useRef<HTMLInputElement>(null);

  const sync = (next: [string, string][]) => {
    setFields(next);
    if (hiddenRef.current) {
      const obj: Record<string, string> = {};
      next.forEach(([k, v]) => { if (k) obj[k] = v; });
      hiddenRef.current.value = JSON.stringify(obj);
    }
  };

  const updateField = (idx: number, pos: 0 | 1, value: string) => {
    const next = fields.map((f, i) => (i === idx ? (pos === 0 ? [value, f[1]] : [f[0], value]) as [string, string] : f));
    sync(next);
  };

  const addField = () => sync([...fields, ["", ""]]);
  const removeField = (idx: number) => sync(fields.filter((_, i) => i !== idx));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg">حقول مخصصة</h3>
        <button
          type="button"
          onClick={addField}
          className="rounded-lg bg-brand-600/20 px-3 py-1 text-xs font-semibold text-brand-200 hover:bg-brand-600/30"
        >
          + إضافة حقل
        </button>
      </div>
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={JSON.stringify(defaultValue)} />
      {fields.length === 0 && (
        <p className="text-xs text-muted">لا توجد حقول مخصصة.</p>
      )}
      <div className="flex flex-col gap-2">
        {fields.map(([key, val], idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="الاسم"
              value={key}
              onChange={(e) => updateField(idx, 0, e.target.value)}
              className="w-1/3 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-brand-500"
            />
            <input
              type="text"
              placeholder="القيمة"
              value={val}
              onChange={(e) => updateField(idx, 1, e.target.value)}
              className="flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => removeField(idx)}
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
