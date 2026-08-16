import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { saveSettingsAllAction } from "@/app/actions/settings";
import AdminSettingsPage from "@/components/admin/AdminSettingsPage";

export const metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPageWrapper() {
  const [settings, products] = await Promise.all([
    getSettings(),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, priceCents: true, currency: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminSettingsPage
      settings={settings}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        priceLabel: formatPrice(p.priceCents, p.currency),
      }))}
      onSave={saveSettingsAllAction}
    />
  );
}
