"use client";

import { useActionState } from "react";
import { createCouponAction, deleteCouponAction, toggleCouponAction, type CouponFormState } from "@/app/actions/coupons";

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usedCount: number;
  maxUses: number;
  maxPerUser: number;
  active: boolean;
  productId: string | null;
  userId: string | null;
  expiresAt: string | null;
};

type Product = { id: string; name: string };

export default function CouponManager({
  coupons,
  products,
}: {
  coupons: Coupon[];
  products: Product[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-4 font-bold text-fg">كوبونات الخصم</h3>

      {coupons.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-2 text-right">الكود</th>
                <th className="px-3 py-2 text-right">النوع</th>
                <th className="px-3 py-2 text-right">القيمة</th>
                <th className="px-3 py-2 text-right">الاستخدامات</th>
                <th className="px-3 py-2 text-right">لكل عميل</th>
                <th className="px-3 py-2 text-right">المنتج</th>
                <th className="px-3 py-2 text-right">الحالة</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line/50">
                  <td className="px-3 py-2 font-bold text-fg">{c.code}</td>
                  <td className="px-3 py-2 text-muted">
                    {c.discountType === "percent" ? "نسبة" : "مبلغ ثابت"}
                  </td>
                  <td className="px-3 py-2 text-fg">
                    {c.discountType === "percent"
                      ? `${c.discountValue}%`
                      : `${c.discountValue / 100} ج.م`}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {c.maxPerUser > 0 ? c.maxPerUser : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {c.productId ? (
                      <span className="rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-200">محدد</span>
                    ) : (
                      <span className="text-muted">الكل</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                      {c.active ? "مفعّل" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="active" value={String(c.active)} />
                        <button type="submit" className="text-xs text-brand-300 hover:text-brand-200">
                          {c.active ? "تعطيل" : "تفعيل"}
                        </button>
                      </form>
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300">حذف</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCouponForm products={products} />
    </section>
  );
}

function CreateCouponForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState(createCouponAction, {} as CouponFormState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <select
        name="productId"
        className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
      >
        <option value="">جميع المنتجات</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input
        name="userEmail"
        type="email"
        placeholder="إيميل عميل معيّن (اختياري)"
        className="rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
      />
      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? "جاري الإضافة..." : "إضافة كوبون"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-3">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-400 sm:col-span-2 lg:col-span-3">تمت إضافة الكوبون بنجاح!</p>}
    </form>
  );
}
