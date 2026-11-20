import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Container from "../../components/Container";
import BookCard from "../../components/BookCard";
import Card from "../../components/Card";
import Reveal from "../../components/Reveal";
import { IconChartBars, IconShieldLock } from "../../components/Icons";
import RichText from "../../components/RichText";
import { useAuth } from "../../context/AuthContext";
import type { Attempt, Exam, SubjectBreakdownRow } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { apiUrl } from "../../lib/api";
import { getAttemptDb, getExamDb, listAttemptsForUser } from "../../lib/db";
import { computePercent, computePercentDisplay, formatPercentFa } from "../../lib/percent";

function optionLabel(i: number) {
  const map = ["الف", "ب", "ج", "د", "هـ", "و", "ز"];
  return map[i] ?? String(i + 1);
}

function QuestionReview({
  q,
  idx,
}: {
  q: NonNullable<Attempt["lessonGroups"]>[number]["questions"][number];
  idx: number;
}) {
  const isPdf = (q as any).no !== undefined;
  const selected = typeof (q as any).selectedIndex === "number" ? (q as any).selectedIndex : null;
  const correctIndex = typeof (q as any).correctIndex === "number" ? (q as any).correctIndex : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted">سؤال {idx.toLocaleString("fa-IR")}</div>
          {isPdf ? (
            <div className="mt-2 font-semibold">شماره سؤال: {(q as any).no?.toLocaleString("fa-IR")}</div>
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
            انتخاب شما: <span className="text-[rgb(var(--text))]/90 font-semibold">{selected === null ? "خالی" : optionLabel(selected)}</span>
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
            const border = isCorrect
              ? "border-emerald-500/60 bg-emerald-500/10"
              : isSel && !isCorrect
                ? "border-rose-500/60 bg-rose-500/10"
                : "border-white/10 bg-white/[0.02]";
            return (
              <div key={i} className={`${base} ${border}`} style={border.includes("white") ? { borderColor: "rgb(var(--border))" } : undefined}>
                <div className="chip !px-2 !py-0.5 text-xs">{optionLabel(i)}</div>
                <RichText text={opt} className="leading-7 flex-1" />
                <div className="flex items-center gap-2">
                  {isSel ? <span className="chip">انتخاب شما</span> : null}
                  {isCorrect ? <span className="chip">گزینه درست</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function keyOf(r: SubjectBreakdownRow) {
  return `${r.lessonCode}__${r.major}__${r.subject}`;
}

function StackedBar({ row }: { row: SubjectBreakdownRow }) {
  const total = Math.max(1, row.total);
  const pc = Math.round((row.correct / total) * 100);
  const pw = Math.round((row.wrong / total) * 100);
  const pb = 100 - pc - pw;

  return (
    <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
      <div className="h-full bg-emerald-400/70" style={{ width: `${pc}%` }} />
      <div className="h-full bg-rose-400/60" style={{ width: `${pw}%` }} />
      <div className="h-full bg-white/10" style={{ width: `${pb}%` }} />
    </div>
  );
}

function CompareMini({ cur, prev }: { cur: number; prev?: number }) {
  const clampPct = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>این آزمون</span>
          <span className="text-[rgb(var(--text))]/80">{formatPercentFa(cur)}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-cyan-500/75" style={{ width: `${clampPct(cur)}%` }} />
        </div>
      </div>

      {typeof prev === "number" ? (
        <div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>آخرین نتیجه قبلی</span>
            <span className="text-[rgb(var(--text))]/80">{formatPercentFa(prev)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-cyan-400/70" style={{ width: `${clampPct(prev)}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted">
            تغییر:{" "}
            <span className={cur - prev >= 0 ? "text-emerald-200" : "text-rose-200"}>
              {formatPercentFa(cur - prev)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">نتیجه قبلی برای مقایسه موجود نیست.</div>
      )}
    </div>
  );
}

export default function StudentAnalysis() {
  const { attemptId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [prevRowsByKey, setPrevRowsByKey] = useState<Map<string, SubjectBreakdownRow>>(new Map());

  useEffect(() => {
    (async () => {
      if (!user || !attemptId) {
        setAttempt(null);
        setExam(null);
        setPrevRowsByKey(new Map());
        return;
      }
      setLoading(true);
      try {
        const a = await getAttemptDb(attemptId);
        setAttempt(a);
        if (a) {
          const e = await getExamDb(a.examId);
          setExam(e);

          const prev = (await listAttemptsForUser(user.id)).filter((x) => x.id !== a.id);
          const map = new Map<string, SubjectBreakdownRow>();
          for (const p of prev) {
            for (const r of p.breakdown || []) {
              const k = keyOf(r);
              if (!map.has(k)) map.set(k, r);
            }
          }
          setPrevRowsByKey(map);
        } else {
          setExam(null);
          setPrevRowsByKey(new Map());
        }
      } catch {
        setAttempt(null);
        setExam(null);
        setPrevRowsByKey(new Map());
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, attemptId]);

  const accessDenied = useMemo(() => {
    if (!user || !attempt) return false;
    return attempt.userId !== user.id;
  }, [user, attempt]);

  if (!user) {
    return (
      <div className="py-10">
        <Container>
          <Card>برای مشاهده تحلیل باید وارد شوید.</Card>
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-10">
        <Container>
          <Card>در حال بارگذاری…</Card>
        </Container>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="py-10">
        <Container>
          <Card>Attempt پیدا نشد.</Card>
        </Container>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="py-10">
        <Container>
          <Card>دسترسی ندارید.</Card>
        </Container>
      </div>
    );
  }

  const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const scorePoints = attempt.correct * 3 - attempt.wrong;
  const maxPoints = attempt.total * 3;
  const penaltyEq = attempt.wrong / 3;

  return (
    <div className="py-8 page-enter">
      <Container>
        <Reveal>
          <BookCard hover={false}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">تحلیل آزمون</div>
                <div className="mt-2 text-2xl font-extrabold">{exam?.title || "آزمون"}</div>
                
                <div className="mt-2 text-xs text-muted">{formatDate(attempt.endedAt)}</div>

                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-7 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">تراز</div>
                    <div className="mt-1 text-2xl font-extrabold">{(attempt.taraz ?? 4000).toLocaleString("fa-IR")}</div>
                    <div className="mt-1 text-[11px] text-muted">کف: ۴۰۰۰</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">{exam?.mode === "pdf" || !exam?.negativeMarking?.enabled ? "درصد" : "درصد (با نمره منفی)"}</div>
                    <div className="mt-1 text-2xl font-extrabold">{computePercentDisplay(attempt.netCorrect, attempt.total)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">رتبه</div>
                    <div className="mt-1 text-xl font-bold">
                      {attempt.rank ? (
                        <span>{attempt.rank.toLocaleString("fa-IR")} از {(attempt.participants ?? 0).toLocaleString("fa-IR")}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">بالاترین درصد</div>
                    <div className="mt-1 text-xl font-bold">{(attempt.bestPercent ?? 0).toLocaleString("fa-IR")}٪</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">صحیح</div>
                    <div className="mt-1 text-xl font-bold">{attempt.correct.toLocaleString("fa-IR")}</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">غلط</div>
                    <div className="mt-1 text-xl font-bold">{attempt.wrong.toLocaleString("fa-IR")}</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3">
                    <div className="text-xs text-muted">خالی</div>
                    <div className="mt-1 text-xl font-bold">{attempt.blank.toLocaleString("fa-IR")}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-muted">
                  <div>
                    نمره (۳×صحیح − غلط):{" "}
                    <span className="text-slate-100">{scorePoints.toLocaleString("fa-IR")}</span> / {maxPoints.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-xs text-muted">
                    خالص معادل: {nf.format(attempt.netCorrect)} / {attempt.total.toLocaleString("fa-IR")} • کسر معادل: {nf.format(penaltyEq)}
                  </div>
                </div>

                {attempt.warnings?.length ? (
                  <div className="mt-3 text-xs text-rose-200 flex items-center gap-2">
                    <IconShieldLock size={16} />
                    هشدارهای امنیتی ثبت‌شده: {attempt.warnings.length.toLocaleString("fa-IR")}
                  </div>
                ) : null}

                {attempt.adminMessage ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm">
                    <div className="text-xs text-muted">پیام ادمین</div>
                    <div className="mt-2 leading-7">{attempt.adminMessage}</div>
                    {attempt.adminMessageAt ? (
                      <div className="mt-2 text-xs text-muted">{formatDate(attempt.adminMessageAt)}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="icon-bubble w-12 h-12">
                <IconChartBars className="text-sky-600 dark:text-cyan-300" />
              </div>
            </div>

            <div className="mt-5 text-sm text-muted">
              <Link className="link" to="/student/results">
                مشاهده همه نتایج
              </Link>
            </div>
          </BookCard>
        </Reveal>

        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-4">
          <Reveal>
            <Card>
              <div className="font-semibold">تحلیل درس به درس</div>
              <div className="mt-4 grid gap-3">
                {(attempt.breakdown || []).length === 0 ? (
                  <div className="text-sm text-muted">داده‌ای برای تحلیل موجود نیست.</div>
                ) : (
                  (attempt.breakdown || []).map((r) => (
                    <div key={keyOf(r)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted">
                            {r.subject} • {r.major} • {r.lessonCode}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="chip">صحیح: {r.correct.toLocaleString("fa-IR")}</span>
                            <span className="chip">غلط: {r.wrong.toLocaleString("fa-IR")}</span>
                            <span className="chip">خالی: {r.blank.toLocaleString("fa-IR")}</span>
                            <span className="chip">کل: {r.total.toLocaleString("fa-IR")}</span>
                            <span className="chip">
                             درصد: {(((r.correct * 3 - r.wrong) / (r.total * 3)) * 100).toFixed(2)}% </span>

                          </div>
                          <div className="mt-3">
                            <StackedBar row={r} />
                            <div className="mt-2 text-xs text-muted">
                              سبز=صحیح، قرمز=غلط، خاکستری=خالی (تقسیم بر کل همان درس)
                            </div>
                          </div>
                        </div>

                        <div className="w-44">
                  {(() => {
                  const cur =
                  r.total ? (((r.correct * 3 - r.wrong) / (r.total * 3)) * 100) : 0;
                  const prevRow = prevRowsByKey.get(keyOf(r));
                  const prev = prevRow && prevRow.total ? (((prevRow.correct * 3 - prevRow.wrong) / (prevRow.total * 3)) * 100) : undefined;
                  return <CompareMini cur={cur} prev={prev} />;
                        })()}
                          </div>

                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card>
              <div className="font-semibold">پاسخ‌نامه (سؤال به سؤال)</div>
              <div className="mt-2 text-sm text-muted leading-7">
                در هر سؤال می‌بینی چه گزینه‌ای زدی و پاسخ صحیح کدام بوده است.
              </div>

              {(attempt.lessonGroups || []).length === 0 ? (
                <div className="mt-4 text-sm text-muted">برای این نتیجه، جزئیات سؤال‌ها در دسترس نیست.</div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {(attempt.lessonGroups || []).map((g) => (
                    <details key={`${g.subject}__${g.lessonCode}__${g.major}`} className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{g.subject}</div>
                          <div className="mt-1 text-xs text-muted">
                            {g.major} • {g.lessonCode} • {g.total.toLocaleString("fa-IR")} سؤال
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="chip">صحیح: {g.correct.toLocaleString("fa-IR")}</span>
                          <span className="chip">غلط: {g.wrong.toLocaleString("fa-IR")}</span>
                          <span className="chip">خالی: {g.blank.toLocaleString("fa-IR")}</span>
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-3">
                        {g.questions.map((q, i) => (
                          <QuestionReview key={("id" in q ? q.id : q.no)} q={q} idx={i + 1} />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal delay={120}>
            <Card>
              <div className="font-semibold">گزارش امنیتی</div>
              <div className="mt-3 text-sm text-muted leading-7">
                در طول آزمون این رویدادها می‌توانند ثبت شوند:
                <ul className="list-disc pr-5 mt-2 space-y-1 text-sm text-muted">
                  <li>خروج از تب (visibility)</li>
                  <li>از فوکوس خارج شدن پنجره (blur)</li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl bg-white/[0.06] border border-white/10 p-3 text-xs text-muted">
                <div className="font-semibold text-[rgb(var(--text))]/80">هشدارها</div>
                {attempt.warnings?.length ? (
                  <div className="mt-2 space-y-1">
                    {attempt.warnings.slice(0, 6).map((w, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="chip">{w.type}</span>
                        <span>{formatDate(w.at)}</span>
                      </div>
                    ))}
                    {attempt.warnings.length > 6 ? <div>…</div> : null}
                  </div>
                ) : (
                  <div className="mt-2 text-muted">بدون هشدار</div>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
