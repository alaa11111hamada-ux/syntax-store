import type { Metadata } from "next";
import { getAdmins } from "@/app/actions/admins";
import { requireAdmin } from "@/lib/auth";
import AdminsClient from "@/components/AdminsClient";

export const metadata: Metadata = { title: "إدارة المديرين" };
export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireAdmin();
  const admins = await getAdmins();

  return (
    <div className="flex flex-col gap-4">
      <AdminsClient admins={admins} />
    </div>
  );
}
