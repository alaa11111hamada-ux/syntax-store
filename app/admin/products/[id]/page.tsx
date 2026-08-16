import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByIdAdmin } from "@/lib/products";
import { updateProductAction } from "@/app/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductByIdAdmin(id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/products" className="text-sm text-brand-300 hover:underline">
          ← المنتجات
        </Link>
        <h2 className="mt-1 text-lg font-extrabold text-fg">تعديل: {product.name}</h2>
      </div>
      <ProductForm
        action={updateProductAction}
        product={product}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
