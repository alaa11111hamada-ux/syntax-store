export default function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-pulse">
      <div className="h-10 w-full rounded-2xl bg-surface-2" />
      <div className="mt-6 h-32 rounded-2xl border border-line bg-surface" />
      <div className="mt-4 h-48 rounded-2xl border border-line bg-surface" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-40 rounded-2xl border border-line bg-surface" />
        <div className="h-40 rounded-2xl border border-line bg-surface" />
      </div>
    </div>
  );
}
