"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, User, Package, Ticket, Heart, LogOut, Menu, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const links = [
  { href: "/account", label: "الرئيسية", icon: Home },
  { href: "/account/profile", label: "الملف الشخصي", icon: User },
  { href: "/account/orders", label: "الطلبات", icon: Package },
  { href: "/account/tickets", label: "التذاكر", icon: Ticket },
  { href: "/wishlist", label: "قائمة الأمنيات", icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <h1 className="text-lg font-extrabold text-fg">حسابي</h1>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl border border-line bg-surface p-2.5 text-fg transition-colors hover:bg-surface-2"
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav
          className={`flex flex-col gap-2 ${
            open ? "flex" : "hidden"
          } lg:flex`}
        >
          {links.map((l) => {
            const Icon = l.icon;
            const isActive =
              l.href === "/account"
                ? pathname === "/account"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-brand-500 bg-brand-600/15 text-brand-200"
                    : "border-line bg-surface text-fg hover:border-brand-600/50 hover:bg-surface-2"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {l.label}
              </Link>
            );
          })}

          <div className="mt-2 border-t border-line pt-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
