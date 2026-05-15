import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "monparfum.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const i = prev.findIndex((p) => p.productId === item.productId);
      if (i >= 0) {
        const c = [...prev];
        c[i] = { ...c[i], quantity: c[i].quantity + qty };
        return c;
      }
      return [...prev, { ...item, quantity: qty }];
    });

  const remove: CartCtx["remove"] = (id) =>
    setItems((prev) => prev.filter((p) => p.productId !== id));

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.productId !== id)
        : prev.map((p) => (p.productId === id ? { ...p, quantity: qty } : p)),
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotalCents = items.reduce((s, i) => s + i.quantity * i.priceCents, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotalCents, add, remove, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};
