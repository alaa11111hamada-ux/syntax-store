export default function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-2" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <div className="aspect-square rounded-xl bg-surface-2" />
            <div className="mt-3 h-4 w-3/4 rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 rounded bg-surface-2" />
            <div className="mt-3 h-6 w-1/3 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
