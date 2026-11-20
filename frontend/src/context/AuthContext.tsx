import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Major } from "../lib/types";
import { apiFetch } from "../lib/api";

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

  loginStudent: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginAdmin: (username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginAdvisor: (identifier: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;

  registerStudent: (
    name: string,
    email: string,
    password: string,
    opts?: { major?: Major; grade?: string; phone?: string; nationalId?: string; address?: string }
  ) => Promise<{ ok: true } | { ok: false; message: string }>;

  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(payload: any): User {
  const p = payload?.profile ?? {};
  return {
    id: payload.id,
    name: p.name ?? "",
    email: payload.email ?? "",
    role: payload.role,
    major: p.major ?? undefined,
    grade: p.grade ?? undefined,
    phone: p.phone ?? undefined,
    nationalId: p.nationalId ?? undefined,
    address: p.address ?? undefined,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

async function tryMe(): Promise<User | null> {
  try {
    const r = await apiFetch<any>("/auth/me");
    if (!r?.user) return null;
    return toUser(r.user);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const u = await tryMe();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const api = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      async loginStudent(email, password) {
        try {
          await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: email.trim(), password }),
          });
          const u = await tryMe();
          setUser(u);
          return { ok: true };
        } catch (e: any) {
          return { ok: false, message: e?.message ?? "خطا در ورود" };
        }
      },

      async loginAdmin(username, password) {
        try {
          const uName = username.trim().toLowerCase();
          if (uName !== "admin") return { ok: false, message: "نام کاربری ادمین نامعتبر است." };
          await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: uName, password }),
          });
          const u = await tryMe();
          setUser(u);
          return { ok: true };
        } catch (e: any) {
          return { ok: false, message: e?.message ?? "خطا در ورود ادمین" };
        }
      },


      async loginAdvisor(identifier, password) {
        try {
          await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: identifier.trim().toLowerCase(), password }),
          });
          const u = await tryMe();
          if (u?.role !== "advisor") return { ok: false, message: "این حساب مشاور نیست." };
          setUser(u);
          return { ok: true };
        } catch (e: any) {
          return { ok: false, message: e?.message ?? "خطا در ورود مشاور" };
        }
      },

      async registerStudent(name, email, password, opts) {
        try {
          if (!name.trim()) return { ok: false, message: "نام را وارد کنید." };
          if (!email.includes("@")) return { ok: false, message: "ایمیل معتبر نیست." };
          if (password.length < 6) return { ok: false, message: "رمز عبور حداقل ۶ کاراکتر باشد." };

          await apiFetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim(),
              password,
              major: opts?.major,
              grade: opts?.grade,
              phone: opts?.phone,
              nationalId: opts?.nationalId,
              address: opts?.address,
            }),
          });
          const u = await tryMe();
          setUser(u);
          return { ok: true };
        } catch (e: any) {
          return { ok: false, message: e?.message ?? "خطا در ثبت‌نام" };
        }
      },

      async logout() {
        try {
          await apiFetch("/auth/logout", { method: "POST" });
        } finally {
          setUser(null);
        }
      },

      async refreshProfile() {
        setUser(await tryMe());
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
