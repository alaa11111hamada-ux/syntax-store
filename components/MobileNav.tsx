"use client";

import { useState } from "react";
import Link from "next/link";
import LiveSearch from "./LiveSearch";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export default function MobileNav({ user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-center rounded-xl p-2 text-muted transition-colors hover:text-brand-300 sm:hidden"
        aria-label="القائمة"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-t border-line bg-bg/95 backdrop-blur sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 p-4" aria-label="قائمة الموبايل">
            <Link href="/" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface">
              الرئيسية
            </Link>
            <Link href="/#products" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface">
              المنتجات
            </Link>
            <Link href="/wishlist" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface">
              المفضلة
            </Link>
            {user && (
              <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface">
                حسابي
              </Link>
            )}
            {user && (
              <Link href="/account/orders" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface">
                طلباتي
              </Link>
            )}
            {(user?.role === "admin" || user?.role === "manager") && (
              <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-brand-300 transition-colors hover:bg-surface">
                لوحة التحكم
              </Link>
            )}
            <div className="mt-2 px-4">
              <LiveSearch />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
