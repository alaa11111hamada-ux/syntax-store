import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/OrderStatus";

export const metadata: Metadata = { title: "التذاكر — لوحة التحكم" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string }> };

const STATUS_MAP: Record<string, string> = {
  open: "مفتوحة",
  replied: "تم الرد",
  closed: "مغلقة",
};

const PRIORITY_MAP: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted",
  normal: "text-fg",
  high: "text-amber-300",
  urgent: "text-red-300",
};

export default async function AdminTicketsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const active = status && ["open", "replied", "closed"].includes(status) ? status : "";

  const tickets = await prisma.supportTicket.findMany({
    where: active ? { status: active } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const filters = [
    { key: "", label: "الكل" },
    { key: "open", label: "مفتوحة" },
    { key: "replied", label: "تم الرد" },
    { key: "closed", label: "مغلقة" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-fg">🎫 التذاكر ({tickets.length})</h2>
      </div>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = f.key === active;
          const params = new URLSearchParams();
          if (f.key) params.set("status", f.key);
          return (
            <Link
              key={f.key || "all"}
              href={`/admin/tickets${params.toString() ? `?${params.toString()}` : ""}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand-500 bg-brand-600/15 text-brand-200"
                  : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          مفيش تذاكر{active ? " في الحالة دي" : ""}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-right text-xs text-muted">
                <th className="px-4 py-3 font-semibold">رقم التذكرة</th>
                <th className="px-4 py-3 font-semibold">العميل</th>
                <th className="px-4 py-3 font-semibold">الموضوع</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">الأولوية</th>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      className="tnum font-bold text-brand-300 hover:underline"
                    >
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{t.user.name}</p>
                    <p className="text-xs text-muted">{t.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-fg">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${
                      t.status === "open" ? "text-green-300" : t.status === "replied" ? "text-blue-300" : "text-muted"
                    }`}>
                      {STATUS_MAP[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${PRIORITY_COLORS[t.priority] ?? ""}`}>
                    {PRIORITY_MAP[t.priority] ?? t.priority}
                  </td>
                  <td className="tnum px-4 py-3 text-muted">
                    {new Date(t.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
