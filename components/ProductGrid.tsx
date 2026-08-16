import type { ProductView } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
}: {
  products: ProductView[];
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center text-muted">
        لسه مفيش منتجات معروضة. ضيف منتجاتك من لوحة التحكم.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
