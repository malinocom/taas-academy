import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[rgb(var(--text))]/80">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h-2V7h2v6Zm0 4h-2v-2h2v2Z"
          />
        </svg>
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted leading-7">{description}</p>
      {actionLabel && actionTo ? (
        <div className="mt-4">
          <Link className="btn-primary" to={actionTo}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
