import { useToast } from "../context/ToastContext";

function tone(type: "success" | "error" | "info") {
  if (type === "success") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (type === "error") return "border-rose-500/30 bg-rose-500/15 text-rose-100";
  return "border-white/10 bg-white/[0.06] text-slate-100";
}

export default function ToastViewport() {
  const { toasts, remove } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[80] w-[92%] max-w-sm space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={["glass rounded-2xl border p-3", "motion-safe:animate-enter", tone(t.type)].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{t.title}</div>
              {t.message ? <div className="mt-1 text-xs opacity-90 leading-6">{t.message}</div> : null}
            </div>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => remove(t.id)}>
              بستن
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
