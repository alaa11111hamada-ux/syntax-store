"use client";

import { exportSalesReport } from "@/app/actions/reports";

export function ExportCsvButton({ from, to }: { from?: string; to?: string }) {
  async function handleExport() {
    const { dataUrl } = await exportSalesReport(from, to);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `sales-report-${from ?? "all"}-${to ?? "all"}.csv`;
    link.click();
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
    >
      تصدير CSV
    </button>
  );
}
