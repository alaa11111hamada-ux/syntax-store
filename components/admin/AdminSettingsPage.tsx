"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

type Settings = Record<string, string>;

type Props = {
  settings: Settings;
  products: { id: string; name: string; priceLabel: string }[];
  onSave: (formData: FormData) => Promise<void>;
};

const TABS = [
  { id: "general", label: "عام", icon: "🏪" },
  { id: "payment", label: "الدفع", icon: "💰" },
  { id: "maintenance", label: "الصيانة", icon: "🔧" },
  { id: "bump", label: "العرض الإضافي", icon: "🎁" },
  { id: "auth", label: "الدخول الاجتماعي", icon: "🔐" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Toggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-11 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-brand-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5 relative" />
      <span className="text-sm font-semibold text-fg">{label}</span>
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  dir,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-fg">
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        dir={dir}
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 5,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-fg">
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none resize-y"
      />
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ═══  تبويبات الإعدادات              ═══ */
/* ═══════════════════════════════════════ */

function GeneralTab({ s }: { s: Settings }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="اسم المتجر" name="store_name" defaultValue={s.store_name} placeholder="اسم متجرك" />
      </div>
      <div className="sm:col-span-2">
        <Textarea label="وصف المتجر" name="store_description" defaultValue={s.store_description} placeholder="وصف قصير للمتجر يظهر في الهيدر والسوشيال" rows={3} />
      </div>
      <div className="sm:col-span-2">
        <Field label="رابط الشعار (URL)" name="store_logo" defaultValue={s.store_logo} placeholder="https://example.com/logo.png" hint="رابط الصورة الكامل للشعار" />
      </div>
      <Field label="البريد الإلكتروني" name="store_email" defaultValue={s.store_email} placeholder="info@mystore.com" type="email" dir="ltr" />
      <Field label="رقم الواتساب" name="store_whatsapp" defaultValue={s.store_whatsapp} placeholder="201012345678+" dir="ltr" hint="بدون علامات + أو مسافات" />
    </div>
  );
}

type PaymentMethodField = { label: string; value: string };
type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  fields: PaymentMethodField[];
  enabled: boolean;
};

const ICON_PRESETS = ["🏦", "📱", "💸", "💳", "🏧", "💰", "🪙", "💵", "📊", "🔐"];

function PaymentTab({ s }: { s: Settings }) {
  const [methods, setMethods] = useState<PaymentMethod[]>(() => {
    try {
      const parsed = JSON.parse(s.payment_methods || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [openIconPicker, setOpenIconPicker] = useState<number | null>(null);

  const updateMethod = (i: number, field: keyof PaymentMethod, val: string | boolean) => {
    setMethods((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  };

  const addMethod = () => {
    setMethods((prev) => [
      ...prev,
      {
        id: `pm_${Date.now()}`,
        name: "",
        icon: "🏦",
        fields: [{ label: "", value: "" }],
        enabled: true,
      },
    ]);
  };

  const removeMethod = (i: number) => {
    setMethods((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addField = (mi: number) => {
    setMethods((prev) =>
      prev.map((m, idx) =>
        idx === mi ? { ...m, fields: [...m.fields, { label: "", value: "" }] } : m
      )
    );
  };

  const updateField = (mi: number, fi: number, field: "label" | "value", val: string) => {
    setMethods((prev) =>
      prev.map((m, idx) =>
        idx === mi
          ? { ...m, fields: m.fields.map((f, fidx) => (fidx === fi ? { ...f, [field]: val } : f)) }
          : m
      )
    );
  };

  const removeField = (mi: number, fi: number) => {
    setMethods((prev) =>
      prev.map((m, idx) =>
        idx === mi ? { ...m, fields: m.fields.filter((_, fidx) => fidx !== fi) } : m
      )
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <input type="hidden" name="payment_methods" value={JSON.stringify(methods)} />

      {methods.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-bg p-8 text-center">
          <p className="text-sm text-muted">مفيش طرق دفع مضافة بعد. اضغط &quot;+ إضافة طريقة دفع&quot; عشان تبدأ.</p>
        </div>
      )}

      {methods.map((method, mi) => (
        <div
          key={method.id}
          className={`rounded-xl border p-4 transition-colors ${
            method.enabled ? "border-brand-600/50 bg-brand-600/5" : "border-line bg-surface"
          }`}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Icon picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenIconPicker(openIconPicker === mi ? null : mi)}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-bg text-2xl transition-colors hover:border-brand-500/50"
                  title="اضغط لتغيير الأيقونة"
                >
                  {method.icon}
                </button>
                {openIconPicker === mi && (
                  <div className="absolute top-12 left-0 z-20 w-48 rounded-xl border border-line bg-surface p-2 shadow-xl">
                    <div className="grid grid-cols-5 gap-1">
                      {ICON_PRESETS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => {
                            updateMethod(mi, "icon", ic);
                            setOpenIconPicker(null);
                          }}
                          className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition-colors ${
                            method.icon === ic ? "bg-brand-600/20" : "hover:bg-surface-2"
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Name */}
              <input
                type="text"
                value={method.name}
                onChange={(e) => updateMethod(mi, "name", e.target.value)}
                placeholder="اسم طريقة الدفع (مثلاً: فودافون كاش)"
                className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm font-bold text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle */}
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={(e) => updateMethod(mi, "enabled", e.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-brand-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5" />
              </label>
              {/* Delete */}
              <button
                type="button"
                onClick={() => removeMethod(mi)}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-2">
            {method.fields.map((field, fi) => (
              <div key={fi} className="flex items-center gap-2">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(mi, fi, "label", e.target.value)}
                  placeholder="اسم الحقل (مثلاً: رقم المحفظة)"
                  className="w-1/3 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => updateField(mi, fi, "value", e.target.value)}
                  placeholder="القيمة (مثلاً: 01012345678)"
                  dir="ltr"
                  className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeField(mi, fi)}
                  className="shrink-0 rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addField(mi)}
            className="mt-2 rounded-lg border border-dashed border-line bg-bg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-600/50 hover:text-fg"
          >
            + إضافة حقل
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addMethod}
        className="rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-brand-600/50 hover:text-fg"
      >
        + إضافة طريقة دفع
      </button>

      <Textarea
        label="ملاحظة الدفع"
        name="payment_note"
        defaultValue={s.payment_note}
        placeholder="بعد التحويل، ارفع صورة الإيصال عشان نأكّد طلبك بسرعة."
        rows={3}
      />
    </div>
  );
}

function MaintenanceTab({ s }: { s: Settings }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <Toggle name="maintenance_mode" defaultChecked={s.maintenance_mode === "1"} label="تفعيل وضع الصيانة" />
      <p className="text-xs text-muted">
        لما وضع الصيانة مفعّل، الزوار مش هيقدروا يشوفوا المنتجات — هيظهرلهم رسالة الصيانة بس.
      </p>
      <Textarea label="رسالة الصيانة" name="maintenance_message" defaultValue={s.maintenance_message} placeholder="المتجر تحت الصيانة — هنرجع قريب إن شاء الله!" rows={3} />
    </div>
  );
}

function BumpTab({ s, products }: { s: Settings; products: Props["products"] }) {
  const [bumpOn, setBumpOn] = useState(s.bump_enabled === "1");
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        bumpOn ? "border-emerald-600/50 bg-emerald-600/5" : "border-line bg-surface"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h4 className="font-bold text-fg">العرض الإضافي (Order Bump)</h4>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="bump_enabled"
            checked={bumpOn}
            onChange={(e) => setBumpOn(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-surface-2 transition-colors peer-checked:bg-emerald-600 after:absolute after:top-0.5 after:right-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:-translate-x-5" />
        </label>
      </div>
      <p className="mb-4 text-sm text-muted">
        منتج بيظهر كصندوق إغراء في صفحة إتمام الطلب — العميل بيضيفه بضغطة واحدة بسعر خاص.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-fg">المنتج</label>
          <select
            name="bump_product_id"
            defaultValue={s.bump_product_id}
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
        <Field label="سعر العرض (جنيه)" name="bump_price" defaultValue={s.bump_price} placeholder="99" dir="ltr" hint="سيبها فاضية = السعر العادي" />
        <Field label="العنوان" name="bump_headline" defaultValue={s.bump_headline} placeholder="أضف العرض ده لطلبك" />
        <Field label="الوصف" name="bump_desc" defaultValue={s.bump_desc} placeholder="سطر بيوضّح ليه العرض مستاهل" />
      </div>
    </div>
  );
}

function AuthTab({ s }: { s: Settings }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="rounded-xl border border-line bg-surface p-4">
        <h4 className="mb-2 font-bold text-fg">تسجيل الدخول بـ Google</h4>
        <p className="mb-4 text-sm text-muted">
          لتفعيل تسجيل الدخول بحساب Google، يجب إنشاء مشروع في{" "}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">
            Google Cloud Console
          </a>{" "}
          وتفعيل OAuth 2.0.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Google Client ID"
            name="google_client_id"
            defaultValue={s.google_client_id}
            placeholder="123456789-xxxx.apps.googleusercontent.com"
            dir="ltr"
            hint="من Google Cloud Console → Credentials → OAuth 2.0"
          />
          <Field
            label="Google Client Secret"
            name="google_client_secret"
            defaultValue={s.google_client_secret}
            placeholder="GOCSPX-xxxxxxxxxxxx"
            dir="ltr"
            hint="من Google Cloud Console → Credentials"
          />
          <Field
            label="Callback URL"
            name="google_callback_url"
            defaultValue={s.google_callback_url}
            placeholder="https://yourstore.com/auth/google"
            dir="ltr"
            hint="اتركه فاضياً للاستخدام التلقائي (سيتم بناؤه من عنوان الموقع)"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ═══  المكوّن الرئيسي               ═══ */
/* ═══════════════════════════════════════ */

export default function AdminSettingsPage({ settings, products, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    setMsg(null);
    startTransition(async () => {
      try {
        await onSave(formData);
        router.refresh();
        setMsg({ type: "ok", text: "تم حفظ الإعدادات بنجاح — التغييرات شغّالة على المتجر فورًا." });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "حصلت مشكلة أثناء الحفظ.";
        setMsg({ type: "err", text: msg });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-extrabold text-fg">⚙️ الإعدادات</h2>
        <p className="text-sm text-muted">
          ادارة كل إعدادات المتجر من مكان واحد.
        </p>
      </div>

      {/* شريط التبويبات */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setMsg(null);
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-brand-600/50 bg-brand-600/10 text-brand-300"
                : "border-line bg-surface text-fg hover:border-brand-600/30 hover:bg-surface-2"
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التبويب */}
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-line bg-surface p-5">
          {/* كل التبويبات موجودة في الـ DOM دايمًا — اللي مش شغّال بس مخفي */}
          <div style={{ display: activeTab === "general" ? undefined : "none" }}>
            <GeneralTab s={settings} />
          </div>
          <div style={{ display: activeTab === "payment" ? undefined : "none" }}>
            <PaymentTab s={settings} />
          </div>
          <div style={{ display: activeTab === "maintenance" ? undefined : "none" }}>
            <MaintenanceTab s={settings} />
          </div>
          <div style={{ display: activeTab === "bump" ? undefined : "none" }}>
            <BumpTab s={settings} products={products} />
          </div>
          <div style={{ display: activeTab === "auth" ? undefined : "none" }}>
            <AuthTab s={settings} />
          </div>
        </div>

        {/* رسائل الحالة */}
        {msg && (
          <p
            className={`rounded-xl border px-4 py-2.5 text-sm ${
              msg.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {msg.type === "ok" ? "✅ " : "❌ "}
            {msg.text}
          </p>
        )}

        {/* زر الحفظ */}
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-xl bg-brand-gradient px-8 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ…" : "حفظ كل الإعدادات"}
        </button>
      </form>
    </div>
  );
}
