import { useMemo } from "react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

function buildPages(current: number, totalPages: number) {
  // Show: 1, (..), current-1..current..current+1, (..), last
  const clamp = (n: number) => Math.max(1, Math.min(totalPages, n));
  const c = clamp(current);
  const set = new Set<number>();
  set.add(1);
  set.add(totalPages);
  for (const p of [c - 1, c, c + 1]) set.add(clamp(p));

  const pages = Array.from(set).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize)));
  const safePage = Math.max(1, Math.min(totalPages, page));

  const items = useMemo(() => buildPages(safePage, totalPages), [safePage, totalPages]);

  if (totalPages <= 1) return null;

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-muted">
        صفحه {safePage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} • {total.toLocaleString("fa-IR")} مورد
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost" disabled={!canPrev} onClick={() => onPageChange(safePage - 1)}>
          قبلی
        </button>

        <div className="flex items-center gap-1">
          {items.map((it, idx) =>
            it === "…" ? (
              <span key={`dots-${idx}`} className="px-2 text-muted">
                …
              </span>
            ) : (
              <button
                key={it}
                className={it === safePage ? "btn-primary px-3 py-2" : "btn-ghost px-3 py-2"}
                onClick={() => onPageChange(it)}
              >
                {it.toLocaleString("fa-IR")}
              </button>
            )
          )}
        </div>

        <button className="btn-ghost" disabled={!canNext} onClick={() => onPageChange(safePage + 1)}>
          بعدی
        </button>
      </div>
    </div>
  );
}
