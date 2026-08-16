"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// عنصر داخل السلة — منتج واحد فقط (كمية ثابتة 1)
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  image: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const STORAGE_KEY = "cart:v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  // تحميل من localStorage بعد أول render (client فقط)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // تجاهل — سلة فاضية
    }
    setReady(true);
  }, []);

  // حفظ عند أي تغيير (بعد التحميل الأولي)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // تجاهل — التخزين ممكن يكون ممتلئ/محظور
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotalCents } = useMemo(() => {
    const count = items.length;
    const subtotalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
    return { count, subtotalCents };
  }, [items]);

  const value: CartContextValue = {
    items,
    count,
    subtotalCents,
    ready,
    add,
    remove,
    clear,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
