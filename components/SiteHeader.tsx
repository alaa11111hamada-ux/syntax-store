import Link from "next/link";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import Logo from "./Logo";
import CartButton from "./CartButton";
import LiveSearch from "./LiveSearch";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";
import { Heart } from "lucide-react";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        {/* أزرار اليمين (في RTL): الحساب + لوحة التحكم للأدمن + قائمة الموبايل */}
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95"
            >
              <UserIcon />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              <span className="sm:hidden">حسابي</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95"
            >
              دخول / حساب جديد
            </Link>
          )}
          {(user?.role === "admin" || user?.role === "manager") && (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:bg-surface-2 sm:flex"
            >
              <GridIcon />
              لوحة التحكم
            </Link>
          )}
        </div>

        {/* روابط الوسط + السلة + البحث + قائمة الموبايل */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LiveSearch />
          </div>
          <ThemeToggle />
          <Link
            href="/wishlist"
            className="relative rounded-xl p-2 text-muted transition-colors hover:text-brand-300"
            aria-label="المفضلة"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <CartButton />
          <MobileNav user={user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null} />
        </div>

        {/* اللوجو (يسار في RTL) */}
        <Logo />
      </div>
    </header>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
