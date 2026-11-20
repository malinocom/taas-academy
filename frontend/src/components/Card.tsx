import React from "react";

export default function Card({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={[
        "glass rounded-3xl p-5",
        hover ? "glass-hover" : "",
        className || "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
