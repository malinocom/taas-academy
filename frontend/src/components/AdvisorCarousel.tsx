import { useEffect, useMemo, useRef, useState } from "react";
import { advisors } from "../data/advisors";
import { IconArrowLeft, IconInstagram, IconSparkles } from "./Icons";

function initials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).replace(/\s/g, "");
}

function Avatar({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  const fallback = useMemo(() => initials(alt), [alt]);

  if (broken) {
    return (
      <div className="h-16 w-16 rounded-full grid place-items-center bg-gradient-to-br from-cyan-500/30 via-sky-600/25 to-cyan-300/30 border"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        <span className="font-extrabold">{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-16 rounded-full object-cover border"
      style={{ borderColor: "rgb(var(--border))" }}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
}

export default function AdvisorCarousel() {
  const list = advisors;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  function scrollTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    const target = kids[i];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setIndex(i);
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      kids.forEach((k, i) => {
        const mid = k.offsetLeft + k.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setIndex(best);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Auto-play (slow) — pauses naturally when user interacts
    const t = window.setInterval(() => {
      setIndex((p) => {
        const next = (p + 1) % list.length;
        scrollTo(next);
        return next;
      });
    }, 6500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <IconSparkles size={16} className="text-[rgb(var(--text))]/80" />
            معرفی مشاورین مجموعه
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold">تیم همراه شما تا روز کنکور</div>
          <p className="mt-2 text-sm text-muted leading-7">
            برای هر رشته، یک مسیر درست و پیگیری منظم؛ با مشاورین تخصصی مجموعه.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            className="btn-ghost px-3"
            onClick={() => scrollTo((index - 1 + list.length) % list.length)}
            aria-label="قبلی"
          >
            <IconArrowLeft className="rotate-180" />
          </button>
          <button
            className="btn-ghost px-3"
            onClick={() => scrollTo((index + 1) % list.length)}
            aria-label="بعدی"
          >
            <IconArrowLeft />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" } as any}
      >
        {list.map((a) => (
          <div
            key={a.id}
            className="snap-center shrink-0 w-[86%] sm:w-[420px]"
          >
            <div className="glass rounded-3xl p-5 h-full">
              <div className="flex items-center gap-4">
                <Avatar src={a.image} alt={a.name} />

                <div className="min-w-0">
                  {a.majorTag ? (
                    <div className="chip mb-2">{a.majorTag}</div>
                  ) : null}
                  <div className="text-xl font-extrabold truncate">{a.name}</div>
                  {a.instagram ? (
                    <div className="mt-2 text-xs text-muted flex items-center gap-2">
                      <IconInstagram size={16} className="text-[rgb(var(--text))]/70" />
                      <span className="font-mono">{a.instagram}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {a.bullets.map((b) => (
                  <div
                    key={b}
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.35)" }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {list.map((_, i) => (
          <button
            key={i}
            className={[
              "h-2.5 rounded-full transition",
              i === index ? "w-8 bg-gradient-to-r from-cyan-500 via-sky-600 to-cyan-300" : "w-2.5 bg-black/10 dark:bg-white/15",
            ].join(" ")}
            onClick={() => scrollTo(i)}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
