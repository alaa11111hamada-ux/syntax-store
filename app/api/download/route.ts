import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth-based download route.
 * User must be logged in and own the order to download files.
 * Query params: orderId, productName, fileUrl (all required).
 * The file URL is validated to belong to the order's products.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const productName = searchParams.get("productName");
  const fileUrl = searchParams.get("fileUrl");

  if (!orderId || !productName || !fileUrl) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  // Find the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Ownership check: user must own the order OR be admin/manager
  const isOwner = order.userId && order.userId === user.id;
  const isAdmin = user.role === "admin" || user.role === "manager";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the file belongs to one of the order's products
  let fileFound = false;
  for (const item of order.items) {
    if (!item.product) continue;

    // Check main fileUrl
    if (item.product.fileUrl && item.product.fileUrl === fileUrl) {
      fileFound = true;
      break;
    }

    // Check extra files
    try {
      const extraFiles = JSON.parse(item.product.files);
      if (Array.isArray(extraFiles)) {
        for (const f of extraFiles) {
          if (f && f.url === fileUrl) {
            fileFound = true;
            break;
          }
        }
      }
    } catch {}

    if (fileFound) break;
  }

  if (!fileFound) {
    return NextResponse.json({ error: "File not found in this order" }, { status: 404 });
  }

  // Resolve the actual file on disk and stream it
  const fs = await import("fs");
  const path = await import("path");

  // fileUrl is like /uploads/products/filename.ext
  const localPath = path.join(process.cwd(), "public", fileUrl);

  if (!fs.existsSync(localPath)) {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(localPath);
  const ext = path.extname(localPath).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";
  const downloadName = `${productName}${ext}`;

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
