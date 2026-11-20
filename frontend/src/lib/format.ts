export function formatDateTime(
  date: string | Date,
  locale = "fa-IR",
) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  });
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  });
}


export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
