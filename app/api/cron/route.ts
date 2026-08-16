import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getApiKey(): string | null {
  return process.env.CRON_API_KEY ?? process.env.ADMIN_API_KEY ?? null;
}

export async function GET(request: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    // لا يوجد مفتاح — نرفض الطلبات للأمان
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const pendingAutoConfirm = await prisma.order.updateMany({
    where: {
      status: "pending",
      createdAt: { lt: oneDayAgo },
    },
    data: { status: "confirmed" },
  });

  const confirmedAutoComplete = await prisma.order.updateMany({
    where: {
      status: "confirmed",
      createdAt: { lt: sevenDaysAgo },
    },
    data: { status: "delivered" },
  });

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    pendingAutoConfirmed: pendingAutoConfirm.count,
    confirmedAutoCompleted: confirmedAutoComplete.count,
  });
}
