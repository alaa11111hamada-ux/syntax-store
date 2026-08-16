import "server-only";
import { prisma } from "@/lib/prisma";
export { ACTION_LABELS, ENTITY_LABELS } from "@/lib/audit-types";
export type { AuditLogEntry, AuditLogFilters } from "@/lib/audit-types";
import type { AuditLogEntry, AuditLogFilters } from "@/lib/audit-types";

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: JSON.stringify(details),
    },
  });
}

export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<{ items: AuditLogEntry[]; total: number; totalPages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 30));

  const where: Record<string, unknown> = {};

  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.entity) {
    where.entity = filters.entity;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = to;
    }
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  let userMap: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    for (const u of users) userMap[u.id] = { name: u.name, email: u.email };
  }

  const items: AuditLogEntry[] = rows.map((r) => ({
    ...r,
    user: r.userId ? userMap[r.userId] ?? null : null,
  }));

  return { items, total, totalPages: Math.ceil(total / perPage) };
}
