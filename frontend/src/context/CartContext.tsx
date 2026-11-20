import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getJson, setJson } from "../lib/storage";
import type { Note } from "../lib/types";
import { useAuth } from "./AuthContext";

export type CartItem = {
  noteId: string;
  title: string;
  price: number;
  qty: number;
  coverEmoji?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (note: Note, qty?: number) => void;
  remove: (noteId: string) => void;
  setQty: (noteId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const KEY_GUEST = "app_cart_guest";
function keyFor(userId?: string) {
  return userId ? `app_cart_${userId}` : KEY_GUEST;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => getJson<CartItem[]>(keyFor(), []));

  // On login: merge guest cart into user cart
  useEffect(() => {
    const ukey = keyFor(user?.id);
    const userCart = getJson<CartItem[]>(ukey, []);
    const guestCart = getJson<CartItem[]>(KEY_GUEST, []);

    if (user) {
      // Merge by noteId
      const merged: CartItem[] = [...userCart];
      for (const g of guestCart) {
        const ex = merged.find((x) => x.noteId === g.noteId);
        if (ex) ex.qty += g.qty;
        else merged.push(g);
      }
      setItems(merged);
      setJson(ukey, merged);
      // Clear guest
      setJson(KEY_GUEST, []);
    } else {
      setItems(guestCart);
    }
  }, [user?.id]);

  function persist(next: CartItem[]) {
    setItems(next);
    setJson(keyFor(user?.id), next);
  }

  const api = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);

    return {
      items,
      count,
      total,

      add(note, qty = 1) {
        const q = Math.max(1, Math.floor(qty));
        const next = [...items];
        const ex = next.find((x) => x.noteId === note.id);
        if (ex) ex.qty += q;
        else next.push({ noteId: note.id, title: note.title, price: note.price, qty: q, coverEmoji: note.coverEmoji });
        persist(next);
      },

      remove(noteId) {
        persist(items.filter((x) => x.noteId !== noteId));
      },

      setQty(noteId, qty) {
        const q = Math.max(1, Math.floor(qty));
        const next = items.map((i) => (i.noteId === noteId ? { ...i, qty: q } : i));
        persist(next);
      },

      clear() {
        persist([]);
      },
    };
  }, [items, user?.id]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
