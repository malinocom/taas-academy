import React from "react";

export default function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "info" | "default";
  className?: string;
}) {
  return <span className={`chip badge-${variant} ${className}`}>{children}</span>;
}
