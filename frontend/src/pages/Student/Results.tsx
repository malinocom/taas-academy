import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "../../components/Container";
import BookCard from "../../components/BookCard";
import Card from "../../components/Card";
import Reveal from "../../components/Reveal";
import { IconChartBars, IconClipboardCheck } from "../../components/Icons";
import { useAuth } from "../../context/AuthContext";
import type { Attempt, Exam } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { getExamDb, listAttemptsForUser } from "../../lib/db";
import { computePercentDisplay } from "../../lib/percent";

export default function StudentResults() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [examsById, setExamsById] = useState<Record<string, Exam>>({});

  const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  useEffect(() => {
    (async () => {
      if (!user) {
        setAttempts([]);
        setExamsById({});
        return;
      }
      setLoading(true);
      try {
        const rows = await listAttemptsForUser(user.id);
        setAttempts(rows);

        const examIds = Array.from(new Set(rows.map((r) => r.examId)));
        const exams = await Promise.all(examIds.map((eid) => getExamDb(eid)));
        const map: Record<string, Exam> = {};
        for (const e of exams) {
          if (e) map[e.id] = e;
        }
        setExamsById(map);
      } catch {
        setAttempts([]);
        setExamsById({});
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="py-10">
        <Container>
          <Card>برای مشاهده نتایج باید وارد شوید.</Card>
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
                <div className="text-xs text-muted">نتایج</div>
                <div className="mt-2 text-3xl font-extrabold">کارنامه و تحلیل‌ها</div>
                <p className="mt-2 text-sm text-muted leading-7">
                  روی هر نتیجه بزن تا تحلیل درس‌به‌درس (صحیح/غلط/خالی) و نمودار مقایسه‌ای را ببینی.
                </p>
              </div>
              <div className="icon-bubble w-12 h-12">
                <IconChartBars className="text-sky-600 dark:text-cyan-300" />
              </div>
            </div>
          </BookCard>
        </Reveal>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <Card>
              <div className="text-sm text-muted">در حال بارگذاری…</div>
            </Card>
          ) : attempts.length === 0 ? (
            <Card>
              <div className="text-sm text-muted">هنوز آزمونی نداده‌اید.</div>
              <div className="mt-3">
                <Link className="btn-primary" to="/exams">
                  مشاهده آزمون‌ها
                  <IconClipboardCheck className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ) : (
            attempts.map((a, idx) => {
              const exam = examsById[a.examId];
              return (
                <Reveal key={a.id} delay={idx * 70}>
                  <BookCard>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted">{formatDate(a.endedAt)}</div>
                        <div className="mt-1 text-xl font-bold">{exam?.title || "آزمون"}</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="chip">تراز: {(a.taraz ?? 4000).toLocaleString("fa-IR")}</span>
                          <span className="chip">درصد: {computePercentDisplay(a.netCorrect, a.total)}</span>
                          {(() => {
                            const scorePoints = a.correct * 3 - a.wrong;
                            const maxPoints = a.total * 3;
                            const penaltyEq = a.wrong / 3;
                            return (
                              <>
                                <span className="chip">
                                  امتیاز: {scorePoints.toLocaleString("fa-IR")} / {maxPoints.toLocaleString("fa-IR")}
                                </span>
                                <span className="chip">
                                  خالص معادل: {nf.format(a.netCorrect)} / {a.total.toLocaleString("fa-IR")}
                                </span>
                                <span className="chip">کسر معادل: {nf.format(penaltyEq)}</span>
                              </>
                            );
                          })()}
                          <span className="chip">صحیح: {a.correct.toLocaleString("fa-IR")}</span>
                          <span className="chip">غلط: {a.wrong.toLocaleString("fa-IR")}</span>
                          <span className="chip">خالی: {a.blank.toLocaleString("fa-IR")}</span>
                          {/* Penalty is derived: wrong/3 (shown as "کسر معادل") */}
                        </div>
                      </div>

                      <Link className="btn-primary whitespace-nowrap" to={`/student/analysis/${a.id}`}>
                        تحلیل
                      </Link>
                    </div>
                  </BookCard>
                </Reveal>
              );
            })
          )}
        </div>
      </Container>
    </div>
  );
}
