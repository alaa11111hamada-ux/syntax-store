import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX = 5 * 1024 * 1024; // 5MB

// Magic bytes للتحقق من محتوى الصورة فعلياً
const SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

async function verifyImageContent(file: File): Promise<boolean> {
  const slice = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  for (const [mime, sig] of Object.entries(SIGNATURES)) {
    if (file.type !== mime) continue;
    return sig.every((byte, i) => slice[i] === byte);
  }
  return false;
}

/** يحفظ صورة مرفوعة في public/uploads/<subdir> ويرجّع المسار العام */
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
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const rand = Array.from({ length: 20 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
  const filename = `${Date.now()}-${rand}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${subdir}/${filename}`;
}
