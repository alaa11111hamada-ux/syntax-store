"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ACTION_LABELS, ENTITY_LABELS, type AuditLogEntry } from "@/lib/audit-types";

export default function AuditLogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page") ?? "1");
  const action = searchParams.get("action") ?? "";
  const entity = searchParams.get("entity") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/admin/audit?${params.toString()}`);
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    fetch(`/api/admin/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, action, entity, dateFrom, dateTo]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold text-fg">سجل التدقيق</h2>

      {/* فلاتر */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">نوع الإجراء</label>
            <select
              value={action}
              onChange={(e) => updateParam("action", e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            >
              <option value="">الكل</option>
              {Object.entries(ACTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">الكيان</label>
            <select
              value={entity}
              onChange={(e) => updateParam("entity", e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            >
              <option value="">الكل</option>
              {Object.entries(ENTITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateParam("dateFrom", e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => updateParam("dateTo", e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">إجمالي السجلات: {total}</p>
      </section>

      {/* جدول السجل */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">جاري التحميل...</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs font-bold text-muted">
                  <th className="px-3 py-2.5">التاريخ</th>
                  <th className="px-3 py-2.5">المستخدم</th>
                  <th className="px-3 py-2.5">الإجراء</th>
                  <th className="px-3 py-2.5">الكيان</th>
                  <th className="px-3 py-2.5">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => {
                  let details = "";
                  try {
                    const parsed = JSON.parse(log.details);
                    details = Object.entries(parsed)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(", ");
                  } catch {
                    details = log.details;
                  }

                  const date = new Date(log.createdAt);
                  const formattedDate = new Intl.DateTimeFormat("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(date);

                  return (
                    <tr key={log.id} className="text-right transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                        {formattedDate}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg">
                        {log.user ? log.user.name : log.userId ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          log.action === "create"
                            ? "bg-green-500/10 text-green-300"
                            : log.action === "delete"
                            ? "bg-red-500/10 text-red-300"
                            : log.action === "status_change"
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-blue-500/10 text-blue-300"
                        }`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg">
                        {ENTITY_LABELS[log.entity] ?? log.entity}
                        {log.entityId && (
                          <span className="ms-1 text-muted">({log.entityId.slice(0, 8)}...)</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-xs text-muted">
                        {details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?${new URLSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-fg transition-colors hover:bg-surface-2"
              >
                السابق
              </Link>
            )}
            <span className="text-xs text-muted">
              صفحة {page} من {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/admin/audit?${new URLSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-fg transition-colors hover:bg-surface-2"
              >
                التالي
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
