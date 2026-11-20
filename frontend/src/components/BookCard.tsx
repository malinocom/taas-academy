import React from "react";

export default function BookCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={[
        "relative glass rounded-3xl p-5 overflow-hidden",
        hover ? "glass-hover" : "",
        // عطف کتاب
        "before:content-[''] before:absolute before:inset-y-0 before:right-0 before:w-2",
        "before:bg-[rgb(var(--glass-bg))] before:border-l before:border-[rgb(var(--border))]",
        // خطوط دفتر (خیلی ملایم)
        "after:content-[''] after:absolute after:inset-0 after:pointer-events-none",
        "after:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]",
        "after:bg-[length:100%_28px] after:opacity-20",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
