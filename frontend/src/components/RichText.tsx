import { useEffect, useMemo, useRef } from "react";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/contrib/mhchem";

type Props = {
  text?: string | null;
  className?: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Minimal markdown for admin/student usage (bold/italic/line breaks).
function toHtml(raw: string) {
  // Headings: support markdown-like "### Title" (kept minimal)
  const lines = raw.split(/\r?\n/);
  const normalized = lines
    .map((ln) => {
      const m = ln.match(/^\s*###\s+(.*)$/);
      if (!m) return ln;
      return `\n<strong>${m[1]}</strong>\n`;
    })
    .join("\n");

  const s = escapeHtml(normalized);
  // bold **...**
  const b = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // italic *...*
  const i = b.replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "$1<em>$2</em>");
  // new lines
  return i.replace(/\n/g, "<br />");
}

export default function RichText({ text, className }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);

  const html = useMemo(() => {
    const v = String(text ?? "");
    return toHtml(v);
  }, [text]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    try {
      renderMathInElement(el, {
        // Support $...$, $$...$$, \(...\), \[...\]
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      // ignore render errors; user content may be incomplete while typing
    }
  }, [html]);

  return <div ref={elRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
