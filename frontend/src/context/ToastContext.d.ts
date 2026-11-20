import React from "react";
export type ToastType = "success" | "error" | "info";
export type Toast = {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
};
type ToastContextValue = {
    toasts: Toast[];
    push: (t: Omit<Toast, "id"> & {
        id?: string;
    }) => void;
    remove: (id: string) => void;
};
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useToast(): ToastContextValue;
export {};
