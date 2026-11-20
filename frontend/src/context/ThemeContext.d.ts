import React from "react";
export type Theme = "dark" | "light";
type ThemeContextValue = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
};
export declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useTheme(): ThemeContextValue;
export {};
