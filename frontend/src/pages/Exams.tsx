import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import Card from "../components/Card";
import Reveal from "../components/Reveal";
import { IconClipboardCheck, IconShield, IconStopwatch } from "../components/Icons";
import type { Exam } from "../lib/types";
import { formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { listExamsAll, listExamsForUser } from "../lib/db";
import LeaderboardModal from "../components/LeaderboardModal";

export default function Exams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const nowMs = Date.now();
  const [leaderboardExam, setLeaderboardExam] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (!user) {
        setExams([]);
        return;
      }
      setLoading(true);
      try {
        const rows = user.role === "admin" ? await listExamsAll() : await listExamsForUser(user.id);
        setExams(rows);
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, user?.role]);

  return (
    <div className="py-10 page-enter">
      <Container>
        <Reveal>
          <BookCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">آزمون‌ها</div>
                <div className="mt-2 text-3xl font-extrabold">لیست آزمون‌ها</div>
                <p className="mt-2 text-sm text-muted leading-7">
                  آزمون‌ها طبق سهم‌بندی ساخته می‌شوند و فقط برای دانش‌آموزان مجاز نمایش داده می‌شوند.
                </p>
              </div>
              <div className="icon-bubble w-12 h-12">
                <IconClipboardCheck className="text-sky-600 dark:text-cyan-300" />
              </div>
            </div>
          </BookCard>
        </Reveal>

        {!user ? (
          <div className="mt-6">
            <Card>
              <div className="text-sm text-muted leading-7">
                برای مشاهده آزمون‌ها ابتدا{" "}
                <Link to="/login" className="link">وارد شوید</Link>.
              </div>
            </Card>
          </div>
        ) : null}

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {loading ? (
            <Card><div className="text-sm text-muted">در حال بارگذاری…</div></Card>
          ) : exams.length === 0 ? (
            <Card>
              <div className="text-sm text-muted leading-7">آزمونی برای نمایش وجود ندارد.</div>
            </Card>
          ) : (
            exams.map((exam, idx) => (
              <Reveal key={exam.id} delay={idx * 70}>
                <BookCard>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted">{formatDate(exam.createdAt)}</div>
                      <div className="mt-1 text-xl font-bold">{exam.title}</div>
                      <p className="mt-2 text-sm text-muted leading-7">{exam.description}</p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="chip">
                          <IconStopwatch size={16} />
                          {exam.durationMinutes.toLocaleString("fa-IR")} دقیقه
                        </span>
                        {exam.mode === "pdf" ? <span className="chip">آزمون PDF</span> : null}
                        <span className="chip">سوال‌ها: {(exam.mode === "pdf" ? (exam.questionCount ?? (exam.answerKey ? Object.keys(exam.answerKey).length : 0)) : exam.questionIds.length).toLocaleString("fa-IR")}</span>
                        <span className="chip">
                          <IconShield size={16} />
                          {exam.mode === "pdf" ? "بدون نمره منفی" : (exam.negativeMarking?.enabled ? `نمره منفی (${exam.negativeMarking.wrongPerPenalty})` : "بدون نمره منفی")}
                        </span>
                        <span className="chip">{exam.assignedUserIds?.length ? "اختصاصی" : "برای همه"}</span>
                      </div>

                      {exam.blueprint?.length ? (
                        <div className="mt-3 text-xs text-muted leading-6">
                          سهم‌بندی: {exam.blueprint.slice(0, 3).map((b) => `${b.count} ${b.subject} (${b.major})`).join("، ")}
                          {exam.blueprint.length > 3 ? " …" : ""}
                        </div>
                      ) : null}
                    </div>

                    {user && user.role === "student" ? (() => {
  const startAt = exam.startAt ? new Date(exam.startAt).getTime() : null;
  const endAt = exam.endAt ? new Date(exam.endAt).getTime() : null;

  const notStarted = startAt && nowMs < startAt;
  const ended = endAt && nowMs > endAt;

  if (notStarted) {
    return (
      <span className="chip">
        شروع از {formatDate(exam.startAt!)}
      </span>
    );
  }

  if (ended) {
    return (
      <div className="flex items-center gap-2">
        <span className="chip">آزمون تمام شده</span>

        <button
          className="btn-primary whitespace-nowrap"
          onClick={() => setLeaderboardExam(exam.id)}
        >
          ۱۰ نفر برتر
        </button>
      </div>
    );
  }

  return (
    <Link
      to={`/exams/${exam.id}/start`}
      className="btn-primary whitespace-nowrap"
    >
      شروع
    </Link>
  );
})() : (
  <span className="chip">
    {exam.published ? "منتشر" : "پیش‌نویس"}
  </span>
)}


                  </div>
                </BookCard>
              </Reveal>
            ))
          )}
        </div>
        {leaderboardExam && (
  <LeaderboardModal
    examId={leaderboardExam}
    onClose={() => setLeaderboardExam(null)}
  />
)}

      </Container>
    </div>
  );
}
