import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/Card";
import RichText from "../../components/RichText";
import { getAttemptDb, listExamsAll } from "../../lib/db";
import type { Attempt, Exam } from "../../lib/types";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../lib/format";
import { computePercentDisplay } from "../../lib/percent";
import { apiUrl } from "../../lib/api";
const PAGE_SIZE = 20;

function optionLabel(i: number) {
  return ["الف", "ب", "ج", "د", "هـ", "و", "ز"][i] ?? String(i + 1);
}

export default function AdminAttemptDetail() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [pageByKey, setPageByKey] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      setLoading(true);
      try {
        const a = await getAttemptDb(attemptId);
        setAttempt(a);
        if (a?.examId) {
          // We don't have a dedicated "get exam" in admin scope here; fetch list and pick.
          const ex = await listExamsAll();
          setExam(ex.find((x) => x.id === a.examId) ?? null);
        }
      } catch (e: any) {
        push({ type: "error", title: "خطا", message: e?.message ?? "دریافت جزئیات ناموفق بود." });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const groups = useMemo(() => attempt?.lessonGroups ?? [], [attempt]);

  function setPage(key: string, page: number) {
    setPageByKey((m) => ({ ...m, [key]: page }));
  }

  if (loading) {
    return (
      <Card hover={false}>
        <div className="text-sm text-muted">در حال بارگذاری…</div>
      </Card>
    );
  }

  if (!attempt) {
    return (
      <Card hover={false}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted">جزئیات یافت نشد.</div>
          <button className="btn-ghost" onClick={() => nav("/admin/attempts")}>بازگشت</button>
        </div>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">جزئیات آزمون</div>
          <div className="mt-1 text-2xl font-extrabold">{exam?.title || "نتیجه آزمون"}</div>
          <div className="mt-2 text-xs text-muted">
            پایان آزمون: {formatDate(attempt.endedAt)} • شناسه: {attempt.id}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a className="btn-ghost" href={`${apiUrl()}/attempts/${attempt.id}/pdf`} target="_blank" rel="noreferrer">دانلود کارنامه PDF</a>
          <button className="btn-ghost" onClick={() => nav(-1)}>بازگشت</button>
          <Link className="btn-ghost" to="/admin/attempts">لیست نتایج</Link>
        </div>
      </div>

      {/* Overall summary */}
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
          <div className="text-xs text-muted">تراز</div>
          <div className="mt-2 text-3xl font-extrabold">{(attempt.taraz ?? 4000).toLocaleString("fa-IR")}</div>
          <div className="mt-2 text-xs text-muted">کف تراز: ۴۰۰۰</div>
        </div>

        <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
          <div className="text-xs text-muted">درصد کلی</div>
          <div className="mt-2 text-3xl font-extrabold">{computePercentDisplay(attempt.netCorrect, attempt.total)}</div>
          <div className="mt-2 text-xs text-muted">خالص: {attempt.netCorrect.toLocaleString("fa-IR")} از {attempt.total.toLocaleString("fa-IR")}</div>
        </div>

        <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
          <div className="text-xs text-muted">رتبه / بالاترین درصد</div>
          <div className="mt-2 text-lg font-bold">
            {attempt.rank ? (
              <span>رتبه {attempt.rank.toLocaleString("fa-IR")} از {(attempt.participants ?? 0).toLocaleString("fa-IR")}</span>
            ) : (
              <span className="text-muted">رتبه: -</span>
            )}
          </div>
          <div className="mt-2 text-sm text-muted">بالاترین درصد آزمون: {(attempt.bestPercent ?? 0).toLocaleString("fa-IR")}٪</div>
        </div>

        <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
          <div className="text-xs text-muted">وضعیت پاسخ‌ها</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="chip">صحیح: {attempt.correct.toLocaleString("fa-IR")}</span>
            <span className="chip">غلط: {attempt.wrong.toLocaleString("fa-IR")}</span>
            <span className="chip">خالی: {attempt.blank.toLocaleString("fa-IR")}</span>
            <span className="chip">جریمه: {attempt.penalty.toLocaleString("fa-IR")}</span>
          </div>
        </div>

        <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg) / 0.25)" }}>
          <div className="text-xs text-muted">تحلیل درس‌به‌درس</div>
          <div className="mt-3 space-y-2">
            {(attempt.breakdown || []).map((b) => (
              <div key={`${b.subject}__${b.lessonCode}__${b.major}`} className="rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.35)" }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-semibold">{b.subject}</div>
                  <div className="text-xs text-muted">{b.major} • {b.lessonCode}</div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm font-bold">
  {(((b.correct * 3 - b.wrong) / (b.total * 3)) * 100).toLocaleString("fa-IR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}٪
</div>                  <div className="mt-1 text-xs text-muted">بالاترین: {(attempt.bestByLesson?.[b.subject] ?? 0).toLocaleString("fa-IR")}٪</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="chip">{b.correct.toLocaleString("fa-IR")}✓</span>
                    <span className="chip">{b.wrong.toLocaleString("fa-IR")}✕</span>
                    <span className="chip">{b.blank.toLocaleString("fa-IR")}○</span>
                  </div>
                </div>
              </div>
            ))}
            {!attempt.breakdown?.length ? <div className="text-sm text-muted">تحلیل درس‌به‌درس موجود نیست.</div> : null}
          </div>
        </div>
      </div>

      {/* Question details with pagination (20 per page) */}
      <div className="mt-8">
        <div className="text-lg font-extrabold">جزئیات سؤال‌ها</div>
        <div className="mt-1 text-xs text-muted">در هر صفحه حداکثر {PAGE_SIZE.toLocaleString("fa-IR")} سؤال نمایش داده می‌شود.</div>

        <div className="mt-4 grid gap-3">
          {groups.map((g) => {
            const key = `${g.subject}__${g.lessonCode}__${g.major}`;
            const page = pageByKey[key] ?? 1;
            const totalPages = Math.max(1, Math.ceil((g.questions?.length || 0) / PAGE_SIZE));
            const safePage = Math.min(totalPages, Math.max(1, page));
            const start = (safePage - 1) * PAGE_SIZE;
            const slice = (g.questions || []).slice(start, start + PAGE_SIZE);

            return (
              <details key={key} className="rounded-3xl border border-white/10 bg-white/[0.02] p-4" open>
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">{g.subject}</div>
                    <div className="mt-1 text-xs text-muted">{g.major} • {g.lessonCode} • {g.total.toLocaleString("fa-IR")} سؤال</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="chip">صحیح: {g.correct.toLocaleString("fa-IR")}</span>
                    <span className="chip">غلط: {g.wrong.toLocaleString("fa-IR")}</span>
                    <span className="chip">خالی: {g.blank.toLocaleString("fa-IR")}</span>
                  </div>
                </summary>

                {/* Pagination */}
                {totalPages > 1 ? (
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-muted">صفحه {safePage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</div>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost" disabled={safePage <= 1} onClick={() => setPage(key, safePage - 1)}>قبلی</button>
                      <button className="btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(key, safePage + 1)}>بعدی</button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {slice.map((q, idx) => {
                    const isPdf = (q as any).no !== undefined;
                    const selected = typeof (q as any).selectedIndex === "number" ? (q as any).selectedIndex : null;
                    const correctIndex = typeof (q as any).correctIndex === "number" ? (q as any).correctIndex : null;
                    const qNo = isPdf ? (q as any).no : start + idx + 1;
                    return (
                      <div key={isPdf ? `no_${(q as any).no}` : (q as any).id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="text-xs text-muted">سؤال {qNo.toLocaleString("fa-IR")}</div>
                            {isPdf ? (
                              <div className="mt-2 text-sm text-muted">(دفترچه PDF) متن سؤال داخل PDF است.</div>
                            ) : (
                              <RichText text={(q as any).prompt} className="mt-2 font-semibold leading-7" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            {selected === null ? <span className="chip">خالی</span> : null}
                            {selected !== null && (q as any).isCorrect ? <span className="chip bg-emerald-500/20 text-emerald-200">صحیح</span> : null}
                            {selected !== null && !(q as any).isCorrect ? <span className="chip bg-rose-500/20 text-rose-200">غلط</span> : null}
                          </div>
                        </div>

                        {!isPdf && (q as any).imageUrl ? (
                          <div className="mt-3">
                            <img className="max-h-64 rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }} src={(q as any).imageUrl} alt="question" />
                          </div>
                        ) : null}

                        {isPdf ? (
                          <div className="mt-4 text-sm text-muted">
                            <div>
                              انتخاب دانش‌آموز: <span className="text-[rgb(var(--text))]/90 font-semibold">{selected === null ? "خالی" : optionLabel(selected)}</span>
                            </div>
                            <div className="mt-1">
                              گزینه صحیح: <span className="text-[rgb(var(--text))]/90 font-semibold">{correctIndex === null ? "-" : optionLabel(correctIndex)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-2">
                            {(((q as any).options || []) as any[]).map((opt, i) => {
                              const isSel = selected === i;
                              const isCorrect = (q as any).correctIndex === i;
                              const base = "flex items-start gap-3 rounded-2xl border px-3 py-2 text-sm transition";
                              const klass = isCorrect
                                ? "border-emerald-500/60 bg-emerald-500/10"
                                : isSel && !isCorrect
                                  ? "border-rose-500/60 bg-rose-500/10"
                                  : "border-white/10 bg-white/[0.02]";
                              return (
                                <div key={i} className={`${base} ${klass}`} style={klass.includes("white") ? { borderColor: "rgb(var(--border))" } : undefined}>
                                  <div className="chip !px-2 !py-0.5 text-xs">{optionLabel(i)}</div>
                                  <div className="leading-7 flex-1">{String(opt)}</div>
                                  <div className="flex items-center gap-2">
                                    {isSel ? <span className="chip">انتخاب دانش‌آموز</span> : null}
                                    {isCorrect ? <span className="chip">گزینه درست</span> : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}

          {!groups.length ? <div className="text-sm text-muted">جزئیات سؤال‌ها موجود نیست.</div> : null}
        </div>
      </div>
    </Card>
  );
}
