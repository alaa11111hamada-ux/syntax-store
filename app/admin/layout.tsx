import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = { title: "لوحة التحكم" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminName={admin.name} permissions={admin.permissions} role={admin.role} />
      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
