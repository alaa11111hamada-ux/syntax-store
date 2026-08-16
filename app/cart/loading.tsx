export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="mt-4 text-sm text-muted">جاري تحميل السلة...</p>
    </div>
  );
}
