import Link from "next/link";
import { createProductAction } from "@/app/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/products" className="text-sm text-brand-300 hover:underline">
          ← المنتجات
        </Link>
        <h2 className="mt-1 text-lg font-extrabold text-fg">منتج جديد</h2>
      </div>
      <ProductForm action={createProductAction} submitLabel="إضافة المنتج" />
    </div>
  );
}
