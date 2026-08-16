import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? undefined;
  const entity = searchParams.get("entity") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");

  const result = await getAuditLogs({ action, entity, dateFrom, dateTo, page });
  return NextResponse.json(result);
}
