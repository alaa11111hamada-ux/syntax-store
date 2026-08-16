"use client";

import { useState } from "react";
import { useWishlist } from "@/lib/wishlist";

export default function WishlistButton({ productId }: { productId: string }) {
  const { has, toggle, ready } = useWishlist();
  const [showToast, setShowToast] = useState(false);
  const [animating, setAnimating] = useState(false);
  if (!ready) return null;

  const isLiked = has(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`absolute top-3 right-3 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60 ${
          isLiked ? "text-red-400" : ""
        }`}
        aria-label={isLiked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        <svg
          className={`h-5 w-5 transition-transform ${animating ? "scale-125" : "scale-100"}`}
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
      {showToast && (
        <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {isLiked ? "تمت الإضافة للمفضلة ♥" : "تمت الإزالة من المفضلة"}
        </div>
      )}
    </>
  );
}
