import React from "react";
import type { Note } from "../lib/types";
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
export declare function CartProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCart(): CartContextValue;
export {};
