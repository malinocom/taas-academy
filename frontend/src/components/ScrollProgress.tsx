import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = (el.scrollHeight || 0) - (el.clientHeight || 0);
      const next = max <= 0 ? 0 : Math.min(1, Math.max(0, el.scrollTop / max));
      setP(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-cyan-400/80 via-sky-600/80 to-cyan-300/80"
        style={{ width: `${Math.round(p * 100)}%` }}
      />
    </div>
  );
}
