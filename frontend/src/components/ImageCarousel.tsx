import { useEffect, useMemo, useState } from "react";

export default function ImageCarousel({
  images,
  alt,
  className,
}: {
  images: string[];
  alt?: string;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);

  useEffect(() => {
    setIdx(0);
  }, [safeImages.join("|")]);

  if (!safeImages.length) return null;

  const current = safeImages[Math.min(idx, safeImages.length - 1)];

  return (
    <div className={className}>
      <div className="rounded-3xl overflow-hidden border" style={{ borderColor: "rgb(var(--border))" }}>
        <img src={current} alt={alt ?? "image"} className="w-full max-h-[420px] object-cover" />
      </div>
      {safeImages.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-auto pb-1">
          {safeImages.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              className={[
                "relative h-16 w-24 flex-shrink-0 rounded-2xl overflow-hidden border",
                i === idx ? "soft-ring" : "opacity-80 hover:opacity-100",
              ].join(" ")}
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <img src={src} alt="thumb" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
