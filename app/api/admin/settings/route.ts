import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const entries = Object.entries(body) as [string, string][];
    const allowedKeys = new Set<string>(SETTING_KEYS);

    const validEntries = entries.filter(([key]) => allowedKeys.has(key));
    if (validEntries.length === 0) {
      return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
    }

    for (const [key, value] of validEntries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
