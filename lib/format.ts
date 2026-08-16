// أدوات تنسيق مشتركة

/** تحويل القروش لسعر منسّق بالجنيه (أو أي عملة) */
export function formatPrice(cents: number, currency = "EGP"): string {
  const value = cents / 100;
  const formatted = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  const label = currency === "EGP" ? "ج.م" : currency;
  return `${formatted} ${label}`;
}

/** تحويل القروش لسعر منسّق حسب اللغة */
export function formatPriceWithLocale(cents: number, currency = "EGP", locale: string = "ar"): string {
  const value = cents / 100;
  const localeCode = locale === "en" ? "en-US" : "ar-EG";
  const formatted = new Intl.NumberFormat(localeCode, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  const label = currency === "EGP" ? (locale === "en" ? "EGP" : "ج.م") : currency;
  return `${formatted} ${label}`;
}

/** نسبة الخصم كنص، مثلاً "-25%" — أو null لو مفيش خصم */
export function discountLabel(
  priceCents: number,
  compareAtCents?: number | null
): string | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  const pct = Math.round((1 - priceCents / compareAtCents) * 100);
  return `-${pct}%`;
}

/** نطاق أسعار — "٥٠ - ١٠٠ ر.س" */
export function formatPriceRange(minCents: number, maxCents: number, currency = "EGP"): string {
  const min = minCents / 100;
  const max = maxCents / 100;
  const fmt = (v: number) =>
    new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: v % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(v);
  const label = currency === "EGP" ? "ج.م" : currency;
  return `${fmt(min)} - ${fmt(max)} ${label}`;
}

/** نص خصم محسوب من سعرين — "خصم ٣٠٪" أو null */
export function formatDiscount(originalCents: number, discountedCents: number): string | null {
  if (!originalCents || originalCents <= discountedCents) return null;
  const pct = Math.round((1 - discountedCents / originalCents) * 100);
  if (pct <= 0) return null;
  const arabicPct = new Intl.NumberFormat("ar-EG").format(pct);
  return `خصم ${arabicPct}٪`;
}

/** حجم ملف — "٢.٥ ميجابايت" */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "٠ بايت";
  const units = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  const formatted = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: idx === 0 ? 0 : 1,
    maximumFractionDigits: idx === 0 ? 0 : 1,
  }).format(value);
  return `${formatted} ${units[idx]}`;
}

/** وقت نسبي — "منذ ٣ ساعات" "منذ يوم" "أمس" */
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

  if (seconds < 60) return "الآن";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  if (days === 1) return "أمس";
  if (days < 7) return rtf.format(-days, "day");
  if (weeks < 5) return rtf.format(-weeks, "week");
  if (days < 30) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}
