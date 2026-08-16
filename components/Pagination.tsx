"use client";

import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({
  page,
  totalPages,
  baseUrl,
}: {
  page: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;

  const pathname = usePathname();

  function href(p: number) {
    const base = baseUrl || pathname;
    if (p > 1) return `${base}?page=${p}`;
    return base;
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="صفحات">
      {page > 1 && (
        <a
          href={href(page - 1)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted hover:border-brand-500/50 hover:text-fg"
        >
          &larr;
        </a>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted">
            ...
          </span>
        ) : (
          <a
            key={p}
            href={href(p)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              p === page
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-line bg-surface text-muted hover:border-brand-500/50 hover:text-fg"
            }`}
          >
            {p}
          </a>
        )
      )}
      {page < totalPages && (
        <a
          href={href(page + 1)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted hover:border-brand-500/50 hover:text-fg"
        >
          &rarr;
        </a>
      )}
    </nav>
  );
}
