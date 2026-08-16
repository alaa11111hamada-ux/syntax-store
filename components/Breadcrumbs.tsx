import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-muted" aria-label="ملاحة">
      <Link href="/" className="hover:text-brand-300" aria-label="الرئيسية">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            <span className="text-muted/50">/</span>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-brand-300">
                {item.label}
              </Link>
            ) : (
              <span className="text-fg">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
