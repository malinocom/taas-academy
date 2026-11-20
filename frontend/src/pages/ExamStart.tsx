import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import Card from "../components/Card";
import Reveal from "../components/Reveal";
import PdfReader from "../components/PdfReader";
import { IconShieldLock, IconStopwatch } from "../components/Icons";
import RichText from "../components/RichText";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { clamp } from "../lib/format";
import type { Exam, Question } from "../lib/types";
import { createAttemptDb, getExamStartDb } from "../lib/db";

type WarningEvent = { type: string; at: string };

type ExamSession = {
  examId: string;
  userId: string;
  startedAt: string;
  endsAt: string;
  qOrder: string[]; // question id (questionBank) OR question number as string (pdf)
  answers: Record<string, number>; // qid/no -> optionIndex 0..3
  warnings: WarningEvent[];
  submittedAt?: string;
};

export function nowIso() {
  return new Date().toISOString();
}


function sessionKey(examId: string, userId: string) {
  return `exam_session_${examId}_${userId}`;
}

function optionLabel(i: number) {
  return ["الف", "ب", "ج", "د"][i] ?? String(i + 1);
}

export default function ExamStart() {
  const { id: examId } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptInfo, setAttemptInfo] = useState<{ allowedAttempts: number; usedAttempts: number; canAttempt: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"lobby" | "running" | "submitted">("lobby");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tick, setTick] = useState(0);

  const submittingRef = useRef(false);

  const isPdf = (exam?.mode ?? "questionBank") === "pdf";

  const allowed = useMemo(() => {
    if (!exam || !user) return false;
    if (user.role !== "student") return false;
    if (!exam.published) return false;
    const list = exam.assignedUserIds || [];
    return list.length === 0 || list.includes(user.id);
  }, [exam, user]);

  const canAttempt = useMemo(() => {
    if (!user) return false;
    if (user.role !== "student") return true;
    return attemptInfo ? attemptInfo.canAttempt : true;
  }, [attemptInfo, user]);
  const pageSize = 20;
  const [page, setPage] = useState(0);
  
  const start1 = page * pageSize;
  const end = start1 + pageSize;
  
  const pageQuestions = session ? session.qOrder.slice(start1, end) : [];
  const totalPages = session ? Math.ceil(session.qOrder.length / pageSize) : 0;
  
    
  useEffect(() => {
    (async () => {
      if (!examId) return;
      setLoading(true);
      try {
        const r = await getExamStartDb(examId);
        setExam(r.exam);
        setQuestions((r.questions || []) as any);
        setAttemptInfo(r.attemptInfo ?? null);
      } catch (err: any) {
        push({ type: "error", title: "خطا", message: err?.message ?? "دریافت آزمون ناموفق بود" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // restore session
  useEffect(() => {
    if (!examId || !user) return;
    const raw = localStorage.getItem(sessionKey(examId, user.id));
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as ExamSession;
      if (s.examId === examId && s.userId === user.id && !s.submittedAt) {
        setSession(s);
        setPhase("running");
      }
    } catch {
      // ignore
    }
  }, [examId, user?.id]);

  // persist
  useEffect(() => {
    if (!session) return;
    localStorage.setItem(sessionKey(session.examId, session.userId), JSON.stringify(session));
  }, [session]);

  // timer
  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const remainingMs = useMemo(() => {
    if (!session) return 0;
    const end = new Date(session.endsAt).getTime();
    return Math.max(0, end - Date.now());
  }, [session, tick]);

  const remainingText = useMemo(() => {
    const sec = Math.floor(remainingMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toLocaleString("fa-IR")}:${s.toLocaleString("fa-IR").padStart(2, "0")}`;
  }, [remainingMs]);

  // auto submit
  useEffect(() => {
    if (phase !== "running" || !session) return;
    if (remainingMs > 0) return;
    void submit("timeout");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, phase, session]);


  function start() {
    if (!exam || !user) return;
    if (!allowed) {
      push({ type: "error", title: "دسترسی ندارید", message: "این آزمون برای شما فعال نیست." });
      return;
    }
    if (user.role === "student" && !canAttempt) {
      push({
        type: "error",
        title: "این آزمون قبلاً انجام شده",
        message: `شما ${(attemptInfo?.usedAttempts ?? 1).toLocaleString("fa-IR")} بار این آزمون را ثبت کرده‌اید. (مجاز: ${(attemptInfo?.allowedAttempts ?? 1).toLocaleString("fa-IR")})`,
      });
      return;
    }

    const startedAt = nowIso();
    let endsAtMs = Date.now() + exam.durationMinutes * 60_000;
    if (exam.endAt) {
      const schedEnd = new Date(exam.endAt).getTime();
      if (Number.isFinite(schedEnd)) endsAtMs = Math.min(endsAtMs, schedEnd);
    }
const endsAt = new Date(endsAtMs).toISOString();


    let qOrder: string[] = [];
    if ((exam.mode ?? "questionBank") === "pdf") {
      const count = exam.questionCount ?? 0;
      if (!count || count <= 0) {
        push({ type: "error", title: "آزمون ناقص", message: "تعداد سوالات PDF تنظیم نشده است." });
        return;
      }
      qOrder = Array.from({ length: count }, (_, i) => String(i + 1));
    } else {
      qOrder = (exam.questionIds || []).slice();
    }

    const s: ExamSession = {
      examId: exam.id,
      userId: user.id,
      startedAt,
      endsAt,
      qOrder,
      answers: {},
      warnings: [],
    };

    setSession(s);
    setPhase("running");
    setActiveIndex(0);
  }

  function setAnswer(qid: string, optionIndex: number) {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, answers: { ...prev.answers, [qid]: optionIndex } };
    });
  }

  function clearAnswer(qid: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev.answers };
      delete next[qid];
      return { ...prev, answers: next };
    });
  }

  const currentId = session ? session.qOrder[activeIndex] : null;
  const currentQuestion = useMemo(() => {
    if (!session || !exam) return null;
    if ((exam.mode ?? "questionBank") === "pdf") {
      return { no: Number(currentId || 1), id: String(currentId || "1") };
    }
    return questions.find((q) => q.id === currentId) || null;
  }, [session, exam, questions, currentId]);

  async function submit(reason: "manual" | "timeout") {
    if (!session || !exam || !user) return;
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      const endedAt = nowIso();
      const attempt = await createAttemptDb({
        examId: exam.id,
        answers: session.answers,
        startedAt: session.startedAt,
        endedAt,
        warnings: [],
      });

      setPhase("submitted");
      setSession((prev) => (prev ? { ...prev, submittedAt: nowIso() } : prev));
      localStorage.removeItem(sessionKey(exam.id, user.id));

      push({ type: "success", title: "ارسال شد", message: reason === "timeout" ? "زمان آزمون تمام شد." : "نتیجه ثبت شد." });
      nav(`/student/analysis/${attempt.id}`);
    } catch (e: any) {
      const msg = e?.message ?? "ثبت نتیجه ناموفق بود";
      if (msg === "ALREADY_ATTEMPTED") {
        push({ type: "error", title: "ثبت نشد", message: "این آزمون برای شما فقط یک بار قابل ثبت است. برای شرکت مجدد باید ادمین اجازه بدهد." });
        setAttemptInfo((prev) =>
          prev
            ? { ...prev, canAttempt: false, usedAttempts: Math.max(prev.usedAttempts, 1) }
            : { allowedAttempts: 1, usedAttempts: 1, canAttempt: false }
        );
      } else {
        push({ type: "error", title: "خطا", message: msg });
      }
    } finally {
      submittingRef.current = false;
    }
  }

  const progress = useMemo(() => {
    if (!session) return 0;
    const answered = Object.keys(session.answers).length;
    return Math.round((answered / Math.max(1, session.qOrder.length)) * 100);
  }, [session]);

  const questionCount = isPdf ? (exam?.questionCount ?? 0) : (exam?.questionIds?.length ?? 0);

  if (loading) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <div className="text-sm text-muted">در حال بارگذاری…</div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <div className="text-sm text-muted">آزمون پیدا نشد.</div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <div className="text-sm text-muted">برای شروع آزمون ابتدا وارد شوید.</div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <div className="text-sm text-muted">این آزمون برای شما فعال نیست یا هنوز منتشر نشده است.</div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 page-enter">
      <Container>
        <Reveal>
          <BookCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">آزمون</div>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold">{exam.title}</div>
                <p className="mt-2 text-sm text-muted leading-7">{exam.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="chip">
                    <IconStopwatch size={16} /> {exam.durationMinutes.toLocaleString("fa-IR")} دقیقه
                  </span>
                  <span className="chip">سوال‌ها: {questionCount.toLocaleString("fa-IR")}</span>
                  <span className="chip">
                    <IconShieldLock size={16} /> {isPdf ? "بدون نمره منفی" : exam.negativeMarking?.enabled ? `نمره منفی (${exam.negativeMarking.wrongPerPenalty})` : "بدون نمره منفی"}
                  </span>
                </div>
              </div>
              <div className="icon-bubble w-12 h-12">
                <IconShieldLock className="text-[rgb(var(--text))]/80" />
              </div>
            </div>
          </BookCard>
        </Reveal>

        {phase === "lobby" ? (
          <div className="mt-6">
            <Card>
              <div className="font-bold">آماده شروع هستید؟</div>
              <div className="mt-3 text-sm text-muted leading-7">روی «شروع آزمون» بزنید.</div>

              {!canAttempt ? (
                <div className="mt-4 rounded-2xl border p-3 text-sm" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.6)" }}>
                  <div className="font-semibold">شما قبلاً این آزمون را انجام داده‌اید.</div>
                  <div className="mt-1 text-xs text-muted">
                    دفعات ثبت‌شده: {(attemptInfo?.usedAttempts ?? 1).toLocaleString("fa-IR")} / مجاز: {(attemptInfo?.allowedAttempts ?? 1).toLocaleString("fa-IR")}
                  </div>
                  <div className="mt-2 text-xs text-muted">برای شرکت مجدد، ادمین باید اجازه بدهد.</div>
                </div>
              ) : null}

              <button className="btn-primary mt-5 w-full" onClick={start} disabled={!canAttempt}>
                شروع آزمون
              </button>
            </Card>
          </div>
        ) : null}

        {phase === "running" && session ? (
          <div className="mt-6 grid lg:grid-cols-12 gap-4 items-start">
            <section className="lg:col-span-8 min-w-0 space-y-4">
              {isPdf ? (
                <Card hover={false}>
                  <div className="mb-3">
                    <div className="text-sm font-bold">دفترچه سوالات آزمون</div>
                    <p className="mt-1 text-xs text-muted">فایل سؤال‌ها را در همین صفحه مشاهده کنید و پاسخ‌ها را در شیت پایین ثبت کنید.</p>
                  </div>
                  {exam.pdfUrl ? <PdfReader url={exam.pdfUrl} /> : <div className="text-sm text-rose-600">فایل PDF برای این آزمون ثبت نشده است.</div>}
                </Card>
              ) : (
                <Card hover={false}>
                  {currentQuestion ? (
                    <>
                      <div className="text-xs text-muted">سؤال {(activeIndex + 1).toLocaleString("fa-IR")} از {session.qOrder.length.toLocaleString("fa-IR")}</div>
                      <RichText text={(currentQuestion as any).prompt} className="mt-2 text-lg font-bold leading-8" />
                      {(currentQuestion as any).imageUrl ? (
                        <div className="mt-4 rounded-3xl overflow-hidden border" style={{ borderColor: "rgb(var(--border))" }}>
                          <img src={(currentQuestion as any).imageUrl} alt="تصویر سؤال" className="w-full max-h-96 object-contain bg-white/50" />
                        </div>
                      ) : null}
                      <div className="mt-4 grid sm:grid-cols-2 gap-2">
                        {((currentQuestion as any).options || []).slice(0, 4).map((option: any, index: number) => {
                          const checked = typeof currentId === "string" && session.answers[currentId] === index;
                          return (
                            <button
                              key={index}
                              className={`rounded-2xl border p-4 text-right transition ${checked ? "btn-primary" : "btn-ghost"}`}
                              style={!checked ? { borderColor: "rgb(var(--border))" } : undefined}
                              onClick={() => currentId && setAnswer(currentId, index)}
                              type="button"
                            >
                              <div className="text-xs text-muted">گزینه {optionLabel(index)}</div>
                              <div className="mt-1 font-semibold leading-7">{String(option)}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex gap-2">
                          <button type="button" className="btn-ghost" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>سؤال قبلی</button>
                          <button type="button" className="btn-ghost" disabled={activeIndex === session.qOrder.length - 1} onClick={() => setActiveIndex((index) => Math.min(session.qOrder.length - 1, index + 1))}>سؤال بعدی</button>
                        </div>
                        <button className="btn-ghost" onClick={() => currentId && clearAnswer(currentId)} type="button">پاک کردن پاسخ</button>
                      </div>
                    </>
                  ) : <div className="text-sm text-muted">سؤال یافت نشد.</div>}
                </Card>
              )}

              <Card hover={false}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-bold">پاسخ‌برگ آزمون</div>
                  <div className="text-xs text-muted">سؤال‌های پاسخ‌داده‌شده با رنگ سبز مشخص می‌شوند.</div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-[390px]">
                    <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-muted" dir="ltr">
                      <div className="text-center">سؤال</div><div className="text-center">۱</div><div className="text-center">۲</div><div className="text-center">۳</div><div className="text-center">۴</div>
                    </div>
                    <div className="mt-2 space-y-1" dir="ltr">
                      {pageQuestions.map((questionId, index) => {
                        const realIndex = start1 + index;
                        const selected = session.answers[questionId] as number | undefined;
                        const isActive = realIndex === activeIndex;
                        return (
                          <div key={questionId} className="grid grid-cols-5 gap-1 items-center">
                            <button
                              type="button"
                              onClick={() => setActiveIndex(realIndex)}
                              className={`h-8 rounded-lg text-[11px] border font-bold ${isActive ? "bg-cyan-600 text-white border-cyan-600" : typeof selected === "number" ? "bg-emerald-500 text-white border-emerald-500" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                            >
                              {(realIndex + 1).toLocaleString("fa-IR")}
                            </button>
                            {[0, 1, 2, 3].map((option) => {
                              const checked = selected === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  aria-label={`سؤال ${realIndex + 1} گزینه ${option + 1}`}
                                  onClick={() => setAnswer(questionId, option)}
                                  className={`h-8 rounded-lg text-[11px] border ${checked ? "btn-primary" : "btn-ghost"}`}
                                  style={!checked ? { borderColor: "rgb(var(--border))" } : undefined}
                                >{option + 1}</button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => { const currentQuestionId = session.qOrder[activeIndex]; if (currentQuestionId) clearAnswer(currentQuestionId); }}
                  >خالی کردن پاسخ سؤال جاری</button>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted">صفحه {(page + 1).toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
                    <button className="btn-ghost px-3 py-1.5" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">قبلی</button>
                    <button className="btn-ghost px-3 py-1.5" disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} type="button">بعدی</button>
                  </div>
                </div>
              </Card>
            </section>

            <aside className="lg:col-span-4 space-y-4">
              <Card hover={false}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold flex items-center gap-2"><IconStopwatch size={18} /> زمان باقی‌مانده</div>
                  <div className="chip">{remainingText}</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted"><span>پیشرفت پاسخ‌گویی</span><span>{progress.toLocaleString("fa-IR")}٪</span></div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-2))" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${clamp(progress, 0, 100)}%`, background: "linear-gradient(90deg, rgb(var(--accent-1)), rgb(var(--accent-3)))" }} />
                  </div>
                </div>
                <button className="btn-primary mt-5 w-full" onClick={() => void submit("manual")} type="button">ثبت نهایی پاسخ‌ها</button>
                <p className="mt-3 text-[11px] text-muted leading-6">پس از ثبت نهایی، امکان ویرایش پاسخ‌ها وجود ندارد.</p>
              </Card>
            </aside>
          </div>
        ) : null}

      </Container>
    </div>
  );
}
