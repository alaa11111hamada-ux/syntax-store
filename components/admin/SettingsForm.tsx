"use client";

import { useActionState, useState } from "react";
import {
  saveSettingsAction,
  type SettingsFormState,
} from "@/app/actions/settings";

type Props = {
  settings: Record<string, string>;
  pixelStates: {
    meta: boolean;
    tiktok: boolean;
    ga: boolean;
    snap: boolean;
    bump: boolean;
  };
  products: { id: string; name: string; priceLabel: string }[];
};

const initial: SettingsFormState = {};

/** صف بكسل: توجّل + خانة الـ ID + تلميح مكانه */
function PixelRow({
  label,
  icon,
  name,
  idName,
  defaultEnabled,
  defaultId,
  placeholder,
  hint,
}: {
  label: string;
  icon: string;
  name: string;
  idName: string;
  defaultEnabled: boolean;
  defaultId: string;
  placeholder: string;
  hint: string;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        enabled ? "border-brand-600/50 bg-brand-600/5" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-fg">
          <span aria-hidden="true">{icon}</span> {label}
        </div>
        {/* توجّل تفعيل */}
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name={name}
            defaultChecked={defaultEnabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-brand-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5" />
        </label>
      </div>
      <input
        type="text"
        name={idName}
        defaultValue={defaultId}
        placeholder={placeholder}
        dir="ltr"
        className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
      />
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function SettingsForm({ settings, pixelStates, products }: Props) {
  const [state, formAction, isPending] = useActionState(saveSettingsAction, initial);
  const [bumpOn, setBumpOn] = useState(pixelStates.bump);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* ═══ البكسلات ═══ */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-1 font-bold text-fg">📡 البكسلات والتتبّع</h3>
        <p className="mb-4 text-sm text-muted">
          فعّل البكسل وحط الـ ID — بيتحقن تلقائيًا في كل صفحات المتجر، وبيتسجّل
          حدث <b className="text-fg">Purchase</b> تلقائيًا بقيمة الطلب عند إتمام أي شراء.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PixelRow
            label="Meta Pixel (فيسبوك/انستجرام)"
            icon="🔵"
            name="meta_pixel_enabled"
            idName="meta_pixel_id"
            defaultEnabled={pixelStates.meta}
            defaultId={settings.meta_pixel_id}
            placeholder="مثال: 123456789012345"
            hint="من Meta Events Manager → Data Sources → الـ Pixel ID"
          />
          <PixelRow
            label="TikTok Pixel"
            icon="⬛"
            name="tiktok_pixel_enabled"
            idName="tiktok_pixel_id"
            defaultEnabled={pixelStates.tiktok}
            defaultId={settings.tiktok_pixel_id}
            placeholder="مثال: CABC123DEF456"
            hint="من TikTok Ads Manager → Assets → Events → Web Events"
          />
          <PixelRow
            label="Google Analytics 4"
            icon="🟡"
            name="ga_enabled"
            idName="ga_measurement_id"
            defaultEnabled={pixelStates.ga}
            defaultId={settings.ga_measurement_id}
            placeholder="مثال: G-XXXXXXXXXX"
            hint="من GA4 → Admin → Data Streams → Measurement ID"
          />
          <PixelRow
            label="Snap Pixel"
            icon="🟨"
            name="snap_pixel_enabled"
            idName="snap_pixel_id"
            defaultEnabled={pixelStates.snap}
            defaultId={settings.snap_pixel_id}
            placeholder="مثال: 1a2b3c4d-5e6f-..."
            hint="من Snapchat Ads Manager → Events Manager"
          />
        </div>
      </section>

      {/* ═══ العرض الإضافي ═══ */}
      <section
        className={`rounded-2xl border p-5 transition-colors ${
          bumpOn ? "border-emerald-600/50 bg-emerald-600/5" : "border-line bg-surface"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="font-bold text-fg">🎁 العرض الإضافي (Order Bump)</h3>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="bump_enabled"
              defaultChecked={pixelStates.bump}
              onChange={(e) => setBumpOn(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-emerald-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5" />
          </label>
        </div>
        <p className="mb-4 text-sm text-muted">
          منتج بيظهر كصندوق إغراء في صفحة إتمام الطلب — العميل بيضيفه بضغطة
          واحدة بسعر خاص. أثبت وسيلة لرفع متوسط قيمة الطلب.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">المنتج</label>
            <select
              name="bump_product_id"
              defaultValue={settings.bump_product_id}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            >
              <option value="">— اختار منتج —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.priceLabel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">
              سعر العرض (جنيه)
            </label>
            <input
              type="text"
              name="bump_price"
              defaultValue={settings.bump_price}
              placeholder="مثال: 99 — سيبها فاضية = السعر العادي"
              dir="ltr"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">العنوان</label>
            <input
              type="text"
              name="bump_headline"
              defaultValue={settings.bump_headline}
              placeholder="مثال: ⚡ أضف دليل الفريلانس بنص السعر — للطلب ده بس"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">
              وصف قصير (اختياري)
            </label>
            <input
              type="text"
              name="bump_desc"
              defaultValue={settings.bump_desc}
              placeholder="سطر بيوضّح ليه العرض ده مستاهل"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* ═══ الحفظ ═══ */}
      {state.error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && !state.error && (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          ✅ تم الحفظ — التغييرات شغّالة على المتجر فورًا.
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-xl bg-brand-gradient px-8 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
