import React from "react";
import type { Major } from "../lib/types";
export type Role = "admin" | "advisor" | "student";
export type User = {
    id: string;
    name: string;
    email: string;
    role: Role;
    major?: Major;
    grade?: string;
    phone?: string;
    nationalId?: string;
    address?: string;
    createdAt: string;
};
type AuthContextValue = {
    user: User | null;
    loading: boolean;
    loginStudent: (email: string, password: string) => Promise<{
        ok: true;
    } | {
        ok: false;
        message: string;
    }>;
    loginAdmin: (username: string, password: string) => Promise<{
        ok: true;
    } | {
        ok: false;
        message: string;
    }>;
    loginAdvisor: (identifier: string, password: string) => Promise<{
        ok: true;
    } | {
        ok: false;
        message: string;
    }>;
    registerStudent: (name: string, email: string, password: string, opts?: {
        major?: Major;
        grade?: string;
        phone?: string;
        nationalId?: string;
        address?: string;
    }) => Promise<{
        ok: true;
    } | {
        ok: false;
        message: string;
    }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
export {};
