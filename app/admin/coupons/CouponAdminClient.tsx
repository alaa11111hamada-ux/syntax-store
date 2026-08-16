"use client";

import { useState, useActionState } from "react";
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
  toggleCouponAction,
  type CouponFormState,
} from "@/app/actions/coupons";

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number;
  usedCount: number;
  maxUses: number;
  maxPerUser: number;
  active: boolean;
  productId: string | null;
  userId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  productName: string | null;
};

type Product = { id: string; name: string };

export default function CouponAdminClient({
  coupons,
  products,
}: {
  coupons: Coupon[];
  products: Product[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-fg">أكواد الخصم ({coupons.length})</h2>
        <button
          type="button"
          onClick={() => { setShowCreate((v) => !v); setEditingId(null); }}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {showCreate ? "إخفاء النموذج" : "+ كوبون جديد"}
        </button>
      </div>

      {showCreate && <CreateCouponForm products={products} />}

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          مفيش أكواد خصم لسه. أضف كوبون جديد عشان تبدأ.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3 text-right">الكود</th>
                <th className="px-3 py-3 text-right">النوع</th>
                <th className="px-3 py-3 text-right">القيمة</th>
                <th className="px-3 py-3 text-right">الحد الأدنى</th>
                <th className="px-3 py-3 text-right">الاستخدامات</th>
                <th className="px-3 py-3 text-right">لكل عميل</th>
                <th className="px-3 py-3 text-right">المنتج</th>
                <th className="px-3 py-3 text-right">الانتهاء</th>
                <th className="px-3 py-3 text-right">الحالة</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line/50 last:border-0">
                  {editingId === c.id ? (
                    <td colSpan={10} className="p-0">
                      <EditCouponRow coupon={c} products={products} onDone={() => setEditingId(null)} />
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-3 font-bold text-fg">{c.code}</td>
                      <td className="px-3 py-3 text-muted">
                        {c.discountType === "percent" ? "نسبة" : "مبلغ ثابت"}
                      </td>
                      <td className="px-3 py-3 text-fg">
                        {c.discountType === "percent"
                          ? `${c.discountValue}%`
                          : `${c.discountValue / 100} ج.م`}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {c.minOrderCents > 0 ? `${c.minOrderCents / 100} ج.م` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <UsageBar used={c.usedCount} max={c.maxUses} />
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {c.maxPerUser > 0 ? c.maxPerUser : "—"}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {c.productName ? (
                          <span className="rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-200">
                            {c.productName}
                          </span>
                        ) : (
                          <span className="text-muted">الكل</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {c.expiresAt ? (
                          <span className={
                            new Date(c.expiresAt) < new Date()
                              ? "text-red-400"
                              : "text-muted"
                          }>
                            {new Date(c.expiresAt).toLocaleDateString("ar-EG")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                          {c.active ? "مفعّل" : "معطّل"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditingId(c.id); setShowCreate(false); }}
                            className="text-xs text-brand-300 hover:text-brand-200"
                          >
                            تعديل
                          </button>
                          <form action={toggleCouponAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="active" value={String(c.active)} />
                            <button type="submit" className="text-xs text-brand-300 hover:text-brand-200">
                              {c.active ? "تعطيل" : "تفعيل"}
                            </button>
                          </form>
                          <form action={deleteCouponAction}
                            onSubmit={(e) => {
                              if (!confirm(`هل أنت متأكد من حذف الكوبون "${c.code}"؟`)) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" className="text-xs text-red-400 hover:text-red-300">حذف</button>
                          </form>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Usage progress bar ─── */
function UsageBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted whitespace-nowrap">
        {used}{max > 0 ? ` / ${max}` : ""}
      </span>
      {max > 0 && (
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Create form ─── */
function CreateCouponForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState(createCouponAction, {} as CouponFormState);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-4 font-bold text-fg">إضافة كوبون جديد</h3>
      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="code"
          placeholder="كود الكوبون (مثلاً: SALE10)"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          required
        />
        <select name="discountType" className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500">
          <option value="percent">نسبة مئوية (%)</option>
          <option value="fixed">مبلغ ثابت (ج.م)</option>
        </select>
        <input
          name="discountValue"
          type="number"
          placeholder="قيمة الخصم"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          required
        />
        <input
          name="minOrderCents"
          type="number"
          placeholder="الحد الأدنى للطلب (ج.م)"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
        <input
          name="maxUses"
          type="number"
          placeholder="أقصى عدد استخدامات (0 = غير محدود)"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
        <input
          name="maxPerUser"
          type="number"
          placeholder="أقصى استخدام لكل عميل (0 = غير محدود)"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
        <input
          name="expiresAt"
          type="date"
          className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
        />
        <select name="productId" className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500">
          <option value="">جميع المنتجات</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? "جاري الإضافة..." : "إضافة كوبون"}
          </button>
        </div>
        {state.error && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-4">{state.error}</p>}
        {state.ok && <p className="text-sm text-green-400 sm:col-span-2 lg:col-span-4">تمت إضافة الكوبون بنجاح!</p>}
      </form>
    </div>
  );
}

/* ─── Edit row (inline) ─── */
function EditCouponRow({
  coupon,
  products,
  onDone,
}: {
  coupon: Coupon;
  products: Product[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateCouponAction, {} as CouponFormState);

  const defaultExpires = coupon.expiresAt
    ? new Date(coupon.expiresAt).toISOString().split("T")[0]
    : "";

  return (
    <div className="bg-brand-600/5 p-4">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={coupon.id} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <input
            name="code"
            defaultValue={coupon.code}
            placeholder="الكود"
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            required
          />
          <select name="discountType" defaultValue={coupon.discountType} className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500">
            <option value="percent">نسبة (%)</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
          <input
            name="discountValue"
            type="number"
            defaultValue={coupon.discountValue}
            placeholder="قيمة الخصم"
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            required
          />
          <input
            name="minOrderCents"
            type="number"
            defaultValue={coupon.minOrderCents / 100}
            placeholder="الحد الأدنى (ج.م)"
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          />
          <input
            name="maxUses"
            type="number"
            defaultValue={coupon.maxUses || ""}
            placeholder="أقصى استخدامات"
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          />
          <input
            name="maxPerUser"
            type="number"
            defaultValue={coupon.maxPerUser || ""}
            placeholder="أقصى لكل عميل"
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          />
          <input
            name="expiresAt"
            type="date"
            defaultValue={defaultExpires}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
          />
          <select name="productId" defaultValue={coupon.productId ?? ""} className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500">
            <option value="">جميع المنتجات</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select name="active" defaultValue={coupon.active ? "true" : "false"} className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500">
            <option value="true">مفعّل</option>
            <option value="false">معطّل</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-line bg-surface px-5 py-2 text-sm font-semibold text-muted hover:text-fg"
          >
            إلغاء
          </button>
        </div>
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state.ok && <p className="text-sm text-green-400">تم التعديل بنجاح!</p>}
      </form>
    </div>
  );
}
