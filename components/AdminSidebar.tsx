"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getEffectivePermissions, isSuperAdmin } from "@/lib/permissions";
import { Tag } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Users,
  PieChart,
  Download,
  UserCog,
  Shield,
  FileText,
  Settings,
  Store,
  LogOut,
  X,
  Menu,
} from "lucide-react";

const sections = [
  {
    title: "إدارة المتجر",
    links: [
      { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, perm: "dashboard_view" },
      { href: "/admin/products", label: "المنتجات", icon: Package, perm: "products_view" },
      { href: "/admin/products/analytics", label: "تحليلات المنتجات", icon: BarChart3, perm: "products_view" },
    ],
  },
  {
    title: "الطلبات",
    links: [
      { href: "/admin/orders", label: "الطلبات", icon: ClipboardList, perm: "orders_view" },
      { href: "/admin/tickets", label: "التذاكر", icon: MessageSquare, perm: "tickets_view" },
      { href: "/admin/coupons", label: "أكواد الخصم", icon: Tag, perm: "coupons_view" },
    ],
  },
  {
    title: "العملاء",
    links: [
      { href: "/admin/customers", label: "العملاء", icon: Users, perm: "customers_view" },
    ],
  },
  {
    title: "التقارير والإعدادات",
    links: [
      { href: "/admin/reports", label: "التقارير", icon: PieChart, perm: "reports_view" },
      { href: "/admin/backup", label: "النسخ الاحتياطي", icon: Download, perm: "backup_view" },
      { href: "/admin/admins", label: "المديرين", icon: Shield, perm: "admins_view" },
      { href: "/admin/audit", label: "سجل التدقيق", icon: FileText, perm: "audit_view" },
      { href: "/admin/settings", label: "الإعدادات", icon: Settings, perm: "settings_view" },
    ],
  },
];

export default function AdminSidebar({
  adminName,
  permissions,
  role,
}: {
  adminName: string;
  permissions: string[];
  role?: string;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const effectivePerms = getEffectivePermissions(role || "admin", permissions);
  const superAdmin = isSuperAdmin(role || "admin", permissions);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  // فلترة الروابط بناءً على الصلاحيات الفعلية
  const filteredSections = useMemo(() => {
    if (superAdmin) return sections; // أدمن رئيسي — يشوف كل حاجة
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => effectivePerms.includes(link.perm)),
      }))
      .filter((section) => section.links.length > 0);
  }, [effectivePerms, superAdmin]);

  const allLinks = filteredSections.flatMap((s) => s.links);

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col overflow-hidden border-s border-line bg-bg transition-all duration-300 ease-in-out shrink-0 ${
        expanded ? "w-64" : "w-14"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-3 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label={expanded ? "إغلاق القائمة" : "فتح القائمة"}
        >
          {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {expanded && (
          <span className="truncate text-sm font-bold text-fg">القائمة</span>
        )}
      </div>

      {/* Links */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {expanded ? (
          <div className="flex flex-col gap-1 px-3 py-2">
            {filteredSections.map((section) => (
              <div key={section.title}>
                <p className="mb-1 mt-2 px-2 text-xs font-semibold text-muted">
                  {section.title}
                </p>
                {section.links.map((l) => {
                  const Icon = l.icon;
                  const isActive =
                    l.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "border border-brand-600/50 bg-brand-600/15 text-brand-200"
                          : "border border-transparent text-fg hover:border-brand-600/30 hover:bg-surface-2"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{l.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-3">
            {allLinks.map((l) => {
              const Icon = l.icon;
              const isActive =
                l.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={l.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-brand-600/15 text-brand-200"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-line px-3 py-3">
        {expanded ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
            >
              <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">المتجر</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">خروج</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/"
              title="المتجر"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Store className="h-5 w-5" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                title="خروج"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
