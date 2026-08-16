"use client";

import { useEffect, useState } from "react";

type DayData = { date: string; revenue: number; orders: number };

export default function RevenueChart() {
  const [data, setData] = useState<DayData[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-bold text-fg">إيرادات آخر 7 أيام</h2>
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-muted">{d.revenue > 0 ? `${d.revenue}` : ""}</span>
            <div
              className="w-full rounded-t-lg bg-brand-500 transition-all"
              style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 120)}px` }}
            />
            <span className="text-[10px] text-muted">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
