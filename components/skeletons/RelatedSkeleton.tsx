export default function RelatedSkeleton() {
  return (
    <div className="mt-10 animate-pulse">
      <div className="h-6 w-40 rounded bg-surface-2" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-3">
            <div className="aspect-square rounded-xl bg-surface-2" />
            <div className="mt-2 h-4 w-3/4 rounded bg-surface-2" />
            <div className="mt-1 h-3 w-1/2 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
