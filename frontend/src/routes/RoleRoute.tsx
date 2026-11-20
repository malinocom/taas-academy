import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";

export default function RoleRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-muted">در حال بارگذاری…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
