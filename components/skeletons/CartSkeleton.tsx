export default function CartSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-surface-2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          <div className="h-16 w-16 rounded-xl bg-surface-2" />
          <div className="flex-1">
            <div className="h-4 w-2/3 rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/3 rounded bg-surface-2" />
          </div>
          <div className="h-6 w-20 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
