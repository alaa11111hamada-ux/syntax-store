import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-extrabold text-brand-300">404</div>
      <h2 className="text-xl font-bold text-fg">الصفحة غير موجودة</h2>
      <p className="max-w-md text-muted">الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.</p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95"
      >
        رجوع للمتجر
      </Link>
    </div>
  );
}
