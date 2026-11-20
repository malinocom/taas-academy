export default function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">{label}</div>
        <span className="stat-card-dot" />
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight break-words">{value}</div>
      {hint ? <div className="mt-2 text-[11px] text-muted leading-6">{hint}</div> : null}
    </div>
  );
}
