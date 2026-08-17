import "server-only";
import { getSupabaseStorage } from "@/lib/supabase-storage";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX = 5 * 1024 * 1024; // 5MB

const SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

async function verifyImageContent(file: File): Promise<boolean> {
  const slice = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  for (const [mime, sig] of Object.entries(SIGNATURES)) {
    if (file.type !== mime) continue;
    return sig.every((byte, i) => slice[i] === byte);
  }
  return false;
}

function randomId(len = 20): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** يحفظ صورة على Supabase Storage ويرجّع الرابط العام */
export async function saveImage(
  file: File,
  subdir: string,
  maxBytes = DEFAULT_MAX
): Promise<string> {
  if (!ALLOWED_IMAGE.includes(file.type)) {
    throw new Error("الصورة لازم تكون JPG أو PNG أو WEBP.");
  }
  if (file.size > maxBytes) {
    throw new Error("حجم الصورة كبير (الحد الأقصى 5 ميجا).");
  }
  if (!(await verifyImageContent(file))) {
    throw new Error("الملف مش صورة حقيقية — تحقق من المحتوى.");
  }

  const supabaseStorage = getSupabaseStorage();

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${subdir}/${Date.now()}-${randomId()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabaseStorage.storage
    .from("uploads")
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (error) throw new Error(`فشل رفع الصورة: ${error.message}`);

  const { data: urlData } = supabaseStorage.storage.from("uploads").getPublicUrl(filename);
  return urlData.publicUrl;
}

/** يحفظ ملف رقمي على Supabase Storage ويرجّع الرابط العام */
export async function saveDigitalFile(file: File): Promise<string> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error("حجم الملف كبير (الحد الأقصى 100 ميجا).");
  }

  const supabaseStorage = getSupabaseStorage();
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const filename = `files/${Date.now()}-${randomId()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabaseStorage.storage
    .from("uploads")
    .upload(filename, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

  if (error) throw new Error(`فشل رفع الملف: ${error.message}`);

  const { data: urlData } = supabaseStorage.storage.from("uploads").getPublicUrl(filename);
  return urlData.publicUrl;
}
