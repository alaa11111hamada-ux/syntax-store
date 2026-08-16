import { getSalesReport } from "@/app/actions/reports";
import { formatPrice } from "@/lib/format";
import { ExportCsvButton } from "./ExportCsvButton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const { from, to } = await searchParams;
  const report = await getSalesReport(from, to);

  const fmt = (d: string) =>
    new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(
      new Date(d)
    );

  const rangeLabel = from || to
    ? `من ${from ? fmt(from) : "—"} إلى ${to ? fmt(to) : "—"}`
    : "آخر 30 يوم";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-fg">تقرير المبيعات</h2>
      </div>

      {/* فلتر التاريخ */}
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-5">
        <div>
          <label className="mb-1 block text-xs text-muted">من تاريخ</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">إلى تاريخ</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          عرض التقرير
        </button>
        <ExportCsvButton from={from} to={to} />
      </form>

      <p className="text-sm text-muted">الفترة: {rangeLabel}</p>

      {/* ملخص */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="إجمالي الطلبات" value={String(report.totalOrders)} />
        <SummaryCard
          label="إجمالي الإيرادات"
          value={formatPrice(report.totalRevenueCents)}
          accent
        />
        <SummaryCard
          label="متوسط قيمة الطلب"
          value={formatPrice(report.avgOrderValueCents)}
        />
        <SummaryCard
          label="عدد المنتجات المباعة"
          value={String(report.topProducts.reduce((s, p) => s + p.qty, 0))}
        />
      </div>

      {/* أعلى المنتجات */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">المنتجات الأكثر مبيعاً</h3>
        {report.topProducts.length === 0 ? (
          <p className="text-sm text-muted">مفيش مبيعات في الفترة دي.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-muted">
                  <th className="pb-2 ps-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">المنتج</th>
                  <th className="pb-2 font-semibold">الكمية</th>
                  <th className="pb-2 pe-2 font-semibold">الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b border-line/50">
                    <td className="py-2.5 ps-2 tnum text-muted">{i + 1}</td>
                    <td className="py-2.5 font-semibold text-fg">{p.name}</td>
                    <td className="py-2.5 tnum text-fg">{p.qty}</td>
                    <td className="py-2.5 pe-2 tnum font-bold text-green-300">
                      {formatPrice(p.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* التفصيل اليومي */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">التفصيل اليومي</h3>
        {report.daily.length === 0 ? (
          <p className="text-sm text-muted">مفيش بيانات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-muted">
                  <th className="pb-2 ps-2 font-semibold">التاريخ</th>
                  <th className="pb-2 font-semibold">الطلبات</th>
                  <th className="pb-2 pe-2 font-semibold">الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((d) => (
                  <tr key={d.date} className="border-b border-line/50">
                    <td className="py-2.5 ps-2 tnum text-fg">{fmt(d.date)}</td>
                    <td className="py-2.5 tnum text-fg">{d.orders}</td>
                    <td className="py-2.5 pe-2 tnum font-bold text-green-300">
                      {formatPrice(d.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? "border-brand-600/50 bg-brand-600/10" : "border-line bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="tnum mt-1 text-lg font-extrabold text-fg">{value}</p>
    </div>
  );
}
