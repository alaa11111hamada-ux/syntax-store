import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { saveSettingsAllAction } from "@/app/actions/settings";
import AdminSettingsPage from "@/components/admin/AdminSettingsPage";

export const metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPageWrapper() {
  let products: { id: string; name: string; priceLabel: string }[] = [];

  const [settings, rawProducts] = await Promise.all([
    getSettings().catch(() => ({} as Record<string, string>)),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, priceCents: true, currency: true },
      orderBy: { name: "asc" },
    }).catch(() => []),
  ]);

  products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    priceLabel: formatPrice(p.priceCents, p.currency),
  }));

  return (
    <AdminSettingsPage
      settings={settings}
      products={products}
      onSave={saveSettingsAllAction}
    />
  );
}
