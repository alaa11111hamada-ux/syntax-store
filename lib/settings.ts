import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * إعدادات المتجر المخزنة في قاعدة البيانات (مفتاح/قيمة).
 * كل المفاتيح المعروفة معرّفة هنا عشان تبقى في مكان واحد.
 */
export const SETTING_KEYS = [
  // ═══ البكسلات / التتبّع ═══
  "meta_pixel_id",
  "meta_pixel_enabled",
  "tiktok_pixel_id",
  "tiktok_pixel_enabled",
  "ga_measurement_id",
  "ga_enabled",
  "snap_pixel_id",
  "snap_pixel_enabled",
  // ═══ العرض الإضافي (Order Bump) ═══
  "bump_enabled",
  "bump_product_id",
  "bump_price",
  "bump_headline",
  "bump_desc",
  // ═══ شكل المتجر ═══
  "store_logo",
  "store_name",
  "store_description",
  "store_whatsapp",
  "store_email",
  "theme_primary_color",
  "theme_bg_color",
  "theme_fg_color",
  // ═══ وسائل التواصل الاجتماعي ═══
  "social_facebook",
  "social_instagram",
  "social_twitter",
  "social_tiktok",
  "social_youtube",
  // ═══ الفوتر ═══
  "footer_text",
  "footer_links", // JSON [{label, url}]
  // ═══ وضع الصيانة ═══
  "maintenance_mode",
  "maintenance_message",
  // ═══ الدفع ═══
  "payment_wallet_name",
  "payment_wallet_number",
  "payment_instapay",
  "payment_bank_account",
  "payment_note",
  "payment_methods", // JSON: PaymentMethod[]
  // ═══ البحث ═══
  "search_enabled",
  // ═══ الدعم ═══
  "support_email",
  "support_whatsapp",
  "support_tickets_enabled",
  // ═══ الضرائب ═══
  "tax_enabled",
  "tax_rate",
  // ═══ الدخول الاجتماعي ═══
  "google_client_id",
  "google_client_secret",
  "google_callback_url",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

// كاش في الذاكرة — يُحدّث كل 60 ثانية فقط
let settingsCache: Record<SettingKey, string> | null = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60_000; // 60 ثانية

/** كل الإعدادات كخريطة { key: value } — القيم الناقصة بترجع "" */
export async function getSettings(): Promise<Record<SettingKey, string>> {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return settingsCache;
  }
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany();
  } catch {
    // DB unavailable during build time — return defaults
    const defaults = {} as Record<SettingKey, string>;
    for (const k of SETTING_KEYS) defaults[k] = "";
    return defaults;
  }
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<SettingKey, string>;
  for (const k of SETTING_KEYS) out[k] = map[k] ?? "";
  settingsCache = out;
  settingsCacheTime = now;
  return out;
}

/** حفظ مجموعة إعدادات دفعة واحدة (upsert لكل مفتاح) */
export async function saveSettings(
  values: Partial<Record<SettingKey, string>>
): Promise<void> {
  const ops = Object.entries(values)
    .filter(([k]) => (SETTING_KEYS as readonly string[]).includes(k))
    .map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value ?? "" },
        create: { key, value: value ?? "" },
      })
    );
  await prisma.$transaction(ops);
  settingsCache = null; // مسح الكاش بعد الحفظ
}

/** هل الإعداد مفعّل؟ ("1" = مفعّل) */
export function isOn(value: string | undefined): boolean {
  return value === "1";
}

// ═══ إعدادات التتبّع الجاهزة للحقن في الواجهة ═══
export type PixelConfig = {
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  gaMeasurementId: string | null;
  snapPixelId: string | null;
};

/** البكسلات المفعّلة فقط (ومعاها ID فعلاً) — دي اللي بتتحقن في الصفحات */
export async function getActivePixels(): Promise<PixelConfig> {
  const s = await getSettings();
  return {
    metaPixelId:
      isOn(s.meta_pixel_enabled) && s.meta_pixel_id.trim() ? s.meta_pixel_id.trim() : null,
    tiktokPixelId:
      isOn(s.tiktok_pixel_enabled) && s.tiktok_pixel_id.trim() ? s.tiktok_pixel_id.trim() : null,
    gaMeasurementId: isOn(s.ga_enabled) && s.ga_measurement_id.trim() ? s.ga_measurement_id.trim() : null,
    snapPixelId:
      isOn(s.snap_pixel_enabled) && s.snap_pixel_id.trim() ? s.snap_pixel_id.trim() : null,
  };
}

// ═══ العرض الإضافي (Order Bump) ═══
export type BumpOffer = {
  productId: string;
  name: string;
  image: string;
  originalCents: number;
  bumpCents: number;
  headline: string;
  desc: string;
};

/** عرض الـ bump الجاهز للعرض في الشيك أوت — null لو مش مفعّل/غير صالح */
export async function getBumpOffer(): Promise<BumpOffer | null> {
  const s = await getSettings();
  if (!isOn(s.bump_enabled) || !s.bump_product_id) return null;

  const product = await prisma.product.findFirst({
    where: { id: s.bump_product_id, active: true },
  });
  if (!product) return null;

  const bumpEgp = Number(s.bump_price.replace(/,/g, ""));
  const bumpCents =
    Number.isFinite(bumpEgp) && bumpEgp > 0
      ? Math.round(bumpEgp * 100)
      : product.priceCents; // لو مفيش سعر خاص → السعر العادي

  let image = "";
  try {
    const imgs = JSON.parse(product.images);
    image = Array.isArray(imgs) && imgs[0] ? imgs[0] : "";
  } catch {}

  return {
    productId: product.id,
    name: product.name,
    image,
    originalCents: product.priceCents,
    bumpCents,
    headline: s.bump_headline.trim() || "أضف العرض ده لطلبك 🎁",
    desc: s.bump_desc.trim() || "",
  };
}

// ═══ طرق الدفع الديناميكية ═══
export type PaymentMethodField = {
  label: string;
  value: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  fields: PaymentMethodField[];
  enabled: boolean;
};

/** جلب طرق الدفع المفعّلة من الإعدادات */
export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const s = await getSettings();
  try {
    const all: PaymentMethod[] = JSON.parse(s.payment_methods || "[]");
    return Array.isArray(all) ? all.filter((m) => m.enabled) : [];
  } catch {
    return [];
  }
}

/** جلب كل طرق الدفع (المفعّلة وغير المفعّلة) */
export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
  const s = await getSettings();
  try {
    const all: PaymentMethod[] = JSON.parse(s.payment_methods || "[]");
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

/** جلب طريقة دفع بالمعرّف */
export async function getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
  const all = await getAllPaymentMethods();
  return all.find((m) => m.id === id) || null;
}
