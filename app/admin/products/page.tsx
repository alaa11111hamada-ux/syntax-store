import { getAllProductsAdmin } from "@/lib/products";
import AdminProductsList from "@/components/admin/AdminProductsList";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getAllProductsAdmin();
  return <AdminProductsList products={products} />;
}
