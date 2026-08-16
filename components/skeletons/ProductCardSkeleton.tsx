export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      {/* صورة */}
      <div className="aspect-square animate-pulse bg-surface-2" />

      {/* محتوى */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* اسم المنتج */}
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-surface-2" />

        {/* السعر */}
        <div className="mt-auto flex items-end justify-between">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
