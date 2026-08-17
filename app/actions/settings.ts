"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveSettings, type SettingKey } from "@/lib/settings";
import { cleanStr } from "@/lib/validation";

export type SettingsFormState = { error?: string; ok?: boolean };

function toggle(formData: FormData, name: string): string {
  return formData.get(name) === "on" ? "1" : "";
}

export async function saveSettingsAllAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
  } catch {
    throw new Error("غير مصرّح لك بتعديل الإعدادات.");
  }

  const bumpEnabled = toggle(formData, "bump_enabled");
  const bumpProductId = cleanStr(formData.get("bump_product_id"), 40);
  const bumpPrice = cleanStr(formData.get("bump_price"), 20);

  if (bumpEnabled) {
    if (!bumpProductId) throw new Error("اختار منتج العرض الإضافي الأول.");
    const product = await prisma.product.findFirst({
      where: { id: bumpProductId, active: true },
    });
    if (!product) throw new Error("منتج العرض الإضافي مش موجود أو غير مفعّل.");
    if (bumpPrice) {
      const n = Number(bumpPrice.replace(/,/g, ""));
      if (!Number.isFinite(n) || n <= 0) throw new Error("سعر العرض الإضافي غير صحيح.");
      if (Math.round(n * 100) >= product.priceCents)
        throw new Error("سعر العرض لازم يكون أقل من سعر المنتج الأصلي.");
    }
  }

  const values: Partial<Record<SettingKey, string>> = {
    store_name: cleanStr(formData.get("store_name"), 120),
    store_description: cleanStr(formData.get("store_description"), 500),
    store_logo: cleanStr(formData.get("store_logo"), 500),
    store_email: cleanStr(formData.get("store_email"), 200),
    store_whatsapp: cleanStr(formData.get("store_whatsapp"), 30),
    theme_primary_color: cleanStr(formData.get("theme_primary_color"), 20),
    theme_bg_color: cleanStr(formData.get("theme_bg_color"), 20),
    theme_fg_color: cleanStr(formData.get("theme_fg_color"), 20),
    social_facebook: cleanStr(formData.get("social_facebook"), 500),
    social_instagram: cleanStr(formData.get("social_instagram"), 500),
    social_twitter: cleanStr(formData.get("social_twitter"), 500),
    social_tiktok: cleanStr(formData.get("social_tiktok"), 500),
    social_youtube: cleanStr(formData.get("social_youtube"), 500),
    payment_note: cleanStr(formData.get("payment_note"), 1000),
    payment_methods: cleanStr(formData.get("payment_methods"), 50000),
    footer_text: cleanStr(formData.get("footer_text"), 1000),
    footer_links: cleanStr(formData.get("footer_links"), 10000),
    maintenance_mode: toggle(formData, "maintenance_mode"),
    maintenance_message: cleanStr(formData.get("maintenance_message"), 1000),
    meta_pixel_id: cleanStr(formData.get("meta_pixel_id"), 40),
    meta_pixel_enabled: toggle(formData, "meta_pixel_enabled"),
    tiktok_pixel_id: cleanStr(formData.get("tiktok_pixel_id"), 40),
    tiktok_pixel_enabled: toggle(formData, "tiktok_pixel_enabled"),
    ga_measurement_id: cleanStr(formData.get("ga_measurement_id"), 40),
    ga_enabled: toggle(formData, "ga_enabled"),
    snap_pixel_id: cleanStr(formData.get("snap_pixel_id"), 60),
    snap_pixel_enabled: toggle(formData, "snap_pixel_enabled"),
    bump_enabled: bumpEnabled,
    bump_product_id: bumpProductId,
    bump_price: bumpPrice,
    bump_headline: cleanStr(formData.get("bump_headline"), 120),
    bump_desc: cleanStr(formData.get("bump_desc"), 300),
    support_email: cleanStr(formData.get("support_email"), 200),
    support_whatsapp: cleanStr(formData.get("support_whatsapp"), 30),
    support_tickets_enabled: toggle(formData, "support_tickets_enabled"),
    google_client_id: cleanStr(formData.get("google_client_id"), 200),
    google_client_secret: cleanStr(formData.get("google_client_secret"), 200),
    google_callback_url: cleanStr(formData.get("google_callback_url"), 500),
  };

  await saveSettings(values);

  const store = await cookies();
  const maintenanceVal = values.maintenance_mode === "1" ? "signed:1" : "";
  store.set("maintenance_mode", maintenanceVal, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maintenanceVal ? 60 * 60 * 24 * 30 : 0,
  });
}

// ═══ الحفظ القديم (محتفظين بيه للتوافق مع الكود الحالي) ═══
export async function saveSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  try {
    await saveSettingsAllAction(formData);
    return { ok: true };
  } catch (e: any) {
    return { error: e?.message || "حدث خطأ غير متوقع." };
  }
}
