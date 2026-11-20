import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import { listAttemptsAll, listExamsAll, setAttemptAdminMessage } from "../../lib/db";
import type { AdminAttemptRow, Exam } from "../../lib/types";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../lib/format";
import { computePercent, computePercentDisplay } from "../../lib/percent";
export default function AdminAttempts() {
  const { push } = useToast();
  const nav = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [rows, setRows] = useState<AdminAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [examId, setExamId] = useState<string>("");
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  function openDetails(id: string) {
    nav(`/admin/attempts/${id}`);
  }

  async function load() {
    setLoading(true);
    try {
      const [ex, at] = await Promise.all([listExamsAll(), listAttemptsAll(examId || undefined)]);
      setExams(ex);
      setRows(at);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت نتایج ناموفق بود." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = [r.examTitle, r.userName, r.userEmail].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [q, rows]);

  async function saveMessage(id: string) {
    const message = (draft[id] ?? "").trim();
    if (!message) {
      push({ type: "error", title: "پیام خالی", message: "متن پیام را وارد کن." });
      return;
    }
    setSavingId(id);
    try {
      await setAttemptAdminMessage(id, message);
      push({ type: "success", title: "ثبت شد", message: "پیام برای دانش‌آموز ذخیره شد." });
      await load();
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ذخیره پیام ناموفق بود." });
    } finally {
      setSavingId(null);
    }
  }

  // (duplicate openDetails removed)

  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted">آزمون‌ها</div>
          <div className="mt-1 text-2xl font-extrabold">نتایج دانش‌آموزان</div>
          <div className="mt-2 text-sm text-muted">برای هر نتیجه می‌تونی پیام بگذاری تا در صفحه تحلیل همون آزمون به دانش‌آموز نمایش داده بشه.</div>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">همه آزمون‌ها</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <input className="input" placeholder="جستجو..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {/* Card-based results (no horizontal scrolling) */}
      <div className="mt-6 grid gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-3xl border p-4 md:p-5"
            style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.35)" }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-muted">آزمون</div>
                <div className="mt-1 text-lg font-extrabold">{r.examTitle || "آزمون"}</div>
                <div className="mt-1 text-xs text-muted">ID: {r.examId}</div>
              </div>

              <div className="text-left">
                <div className="text-xs text-muted">تاریخ</div>
                <div className="mt-1 text-sm font-semibold">{formatDate(r.endedAt)}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
                <div className="text-xs text-muted">دانش‌آموز</div>
                <div className="mt-2 font-bold">{r.userName || r.userEmail || r.userId}</div>
                <div className="mt-1 text-xs text-muted">{r.userEmail || "—"}</div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted">تراز / درصد</div>
                    <div className="mt-1 text-2xl font-extrabold">{(r.taraz ?? 4000).toLocaleString("fa-IR")}</div>
                    <div
                      className="mt-1 text-lg font-bold"
                      style={{ color: computePercent(r.netCorrect, r.total) < 0 ? "rgb(248 113 113)" : undefined }}
                    >
                      {computePercentDisplay(r.netCorrect, r.total)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs justify-end">
                    <span className="chip">صحیح: {r.correct.toLocaleString("fa-IR")}</span>
                    <span className="chip">غلط: {r.wrong.toLocaleString("fa-IR")}</span>
                    <span className="chip">خالی: {r.blank.toLocaleString("fa-IR")}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted">
                  {(() => {
                    const scorePoints = r.correct * 3 - r.wrong;
                    const maxPoints = r.total * 3;
                    const penaltyEq = r.wrong / 3;
                    return (
                      <>
                        امتیاز: {scorePoints.toLocaleString("fa-IR")} / {maxPoints.toLocaleString("fa-IR")} • خالص معادل: {nf.format(r.netCorrect)} / {r.total.toLocaleString("fa-IR")} (کسر: {nf.format(penaltyEq)})
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs text-muted">پیام ادمین</div>
                  <div className="mt-1 text-xs text-muted">این پیام در صفحه تحلیل آزمون به دانش‌آموز نمایش داده می‌شود.</div>
                </div>
                {r.adminMessageAt ? <div className="text-xs text-muted">آخرین ثبت: {formatDate(r.adminMessageAt)}</div> : null}
              </div>
              <textarea
                className="textarea mt-3"
                rows={3}
                placeholder="پیام/بازخورد برای دانش‌آموز..."
                value={draft[r.id] ?? r.adminMessage ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
              />
              <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                <button className="btn-primary" disabled={savingId === r.id} onClick={() => void saveMessage(r.id)}>
                  {savingId === r.id ? "در حال ذخیره..." : "ذخیره پیام"}
                </button>
                <button className="btn-ghost whitespace-nowrap" onClick={() => openDetails(r.id)}>
                  جزئیات و تحلیل
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="mt-3 text-sm text-muted">در حال بارگذاری…</div> : null}
      {!loading && filtered.length === 0 ? <div className="mt-3 text-sm text-muted">نتیجه‌ای یافت نشد.</div> : null}
    </Card>
  );
}
