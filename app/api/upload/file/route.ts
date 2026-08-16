import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "zip", "rar", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "mp3", "mp4", "wav", "avi", "mov", "mkv",
  "jpg", "jpeg", "png", "webp", "gif", "svg",
]);

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  const rand = Array.from({ length: 16 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const filename = `${Date.now()}-${rand}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", "files");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/files/${filename}` });
}
