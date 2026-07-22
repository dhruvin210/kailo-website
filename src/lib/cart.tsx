import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, type Product } from "./products";

export type CartItem = { id: string; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  detailed: { product: Product; quantity: number }[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "kailo-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const detailed = items
      .map((i) => {
        const product = PRODUCTS.find((p) => p.id === i.id);
        return product ? { product, quantity: i.quantity } : null;
      })
      .filter(Boolean) as { product: Product; quantity: number }[];
    return {
      items,
      detailed,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: detailed.reduce((s, d) => s + d.product.price * d.quantity, 0),
      add: (id, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === id);
          if (found) return prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + qty } : p));
          return [...prev, { id, quantity: qty }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      update: (id, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
