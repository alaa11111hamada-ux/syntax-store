export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* رأس الجدول */}
      <div className="border-b border-line px-5 py-3">
        <div className="flex gap-4">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
        </div>
      </div>

      {/* صفوف */}
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
            <div className="ms-auto h-6 w-16 animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
