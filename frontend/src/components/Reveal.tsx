import React from "react";
import { useReveal } from "../lib/useReveal";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        "transition duration-700 will-change-transform",
        "motion-safe:opacity-0 motion-safe:translate-y-6",
        shown ? "motion-safe:opacity-100 motion-safe:translate-y-0" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
