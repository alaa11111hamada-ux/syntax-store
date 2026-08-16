"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import type { ProductView } from "@/lib/products";

type Props = {
  product: ProductView;
  variant?: "card" | "full";
};

function toCartItem(p: ProductView): Omit<CartItem, "qty"> {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    image: p.images[0] ?? "/products/placeholder.svg",
  };
}

export default function AddToCartButton({ product, variant = "card" }: Props) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    add(toCartItem(product));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="shrink-0 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
        aria-label={`أضف ${product.name} للسلة`}
      >
        {justAdded ? "تمت ✓" : "أضف للسلة"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-xl bg-brand-gradient px-8 py-3.5 text-center text-base font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95 sm:w-auto"
      >
        {justAdded ? "تمت الإضافة للسلة ✓" : "أضف للسلة"}
      </button>

      {justAdded && (
        <p className="text-sm font-medium text-green-400">
          اتضاف للسلة. تقدر تكمّل تسوّق أو تروح للسلة.
        </p>
      )}
    </div>
  );
}
