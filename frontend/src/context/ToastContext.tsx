import React, { createContext, useContext, useMemo, useState } from "react";
import { id } from "../lib/id";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string }) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo<ToastContextValue>(
    () => ({
      toasts,

      push(t) {
        const tid = t.id || id("toast");
        const toast: Toast = { id: tid, type: t.type, title: t.title, message: t.message };
        setToasts((prev) => [toast, ...prev].slice(0, 4));
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== tid));
        }, 3200);
      },

      remove(tid) {
        setToasts((prev) => prev.filter((x) => x.id !== tid));
      },
    }),
    [toasts]
  );

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
