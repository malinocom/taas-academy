import React from "react";

export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // min-w-0 is important inside flex/grid parents to prevent overflow forcing the header/menu to visually "shift".
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 min-w-0 ${className}`}>{children}</div>;
}
