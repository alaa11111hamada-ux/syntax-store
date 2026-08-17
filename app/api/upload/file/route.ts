import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseStorage } from "@/lib/supabase-storage";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "zip", "rar", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "mp3", "mp4", "wav", "avi", "mov", "mkv",
  "jpg", "jpeg", "png", "webp", "gif", "svg",
]);

function randomId(len = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const filename = `files/${Date.now()}-${randomId()}-${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const supabase = getSupabaseStorage();
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filename, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filename);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
