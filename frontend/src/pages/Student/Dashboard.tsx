import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Stat from "../../components/Stat";
import { useAuth } from "../../context/AuthContext";
import type { Attempt, Exam } from "../../lib/types";
import { getExamDb, listAttemptsForUser } from "../../lib/db";
import { computePercentDisplay, formatPercentFa } from "../../lib/percent";

const SHORTCUTS = [
  { to: "/exams", title: "آزمون آنلاین", detail: "مشاهده و شرکت در آزمون‌ها", icon: "▤" },
  { to: "/student/results", title: "کارنامه و تحلیل", detail: "بررسی نتایج و روند عملکرد", icon: "▥" },
  { to: "/student/plan", title: "برنامه درسی", detail: "مشاهده برنامه اختصاصی", icon: "▦" },
  { to: "/student/competition", title: "رقابت مطالعاتی", detail: "ثبت رکورد و مشاهده رتبه", icon: "🏁" },
  { to: "/student/work-reports", title: "گزارش کار", detail: "ارسال گزارش فعالیت روزانه", icon: "✓" },
  { to: "/student/orders", title: "سفارش‌ها", detail: "پیگیری خریدهای ثبت‌شده", icon: "▣" },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [lastExam, setLastExam] = useState<Exam | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setAttempts([]);
        setLastExam(null);
        return;
      }
      setLoading(true);
      try {
        const rows = await listAttemptsForUser(user.id);
        if (!active) return;
        setAttempts(rows);
        const last = rows[0];
        setLastExam(last ? await getExamDb(last.examId) : null);
      } catch {
        if (active) {
          setAttempts([]);
          setLastExam(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  const avgPct = useMemo(() => {
    if (!attempts.length) return 0;
    return attempts.reduce((sum, attempt) => sum + (attempt.total ? (attempt.netCorrect / attempt.total) * 100 : 0), 0) / attempts.length;
  }, [attempts]);

  const last = attempts[0] || null;

  return (
    <div className="space-y-5">
      <Card hover={false} className="admin-dashboard-hero">
        <div className="text-xs font-semibold text-sky-700 dark:text-cyan-300">پنل دانش‌آموز</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">سلام {user?.name || "دانش‌آموز عزیز"} 👋</h1>
        <p className="mt-2 text-sm text-muted leading-7">اینجا می‌توانی وضعیت آزمون‌ها، برنامه درسی و فعالیت‌های آموزشی خودت را دنبال کنی.</p>
      </Card>

      {loading ? <Card hover={false}><div className="text-sm text-muted">در حال دریافت اطلاعات…</div></Card> : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Stat label="تعداد آزمون‌ها" value={attempts.length.toLocaleString("fa-IR")} hint="کارنامه‌های ثبت‌شده" />
        <Stat label="میانگین درصد" value={formatPercentFa(avgPct)} hint="میانگین عملکرد در آزمون‌ها" />
        <Stat label="آخرین آزمون" value={lastExam?.title || "—"} hint={last ? computePercentDisplay(last.netCorrect, last.total) : "هنوز آزمونی ثبت نشده"} />
        <Stat label="پیشنهاد امروز" value="مرور و تمرین" hint="با توجه به آخرین عملکردت" />
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-extrabold">دسترسی سریع</h2>
          <Link to="/help" className="link text-xs">راهنمای سامانه</Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {SHORTCUTS.map((item) => (
            <Link to={item.to} key={item.to} className="admin-action-card">
              <span className="admin-action-icon">{item.icon}</span>
              <span className="min-w-0"><span className="block font-bold text-sm">{item.title}</span><span className="block mt-1 text-xs text-muted leading-6">{item.detail}</span></span>
              <span className="admin-action-arrow">←</span>
            </Link>
          ))}
        </div>
      </section>

      {last && lastExam ? (
        <Card hover={false}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div><div className="text-xs text-muted">آخرین کارنامه</div><div className="mt-1 font-extrabold">{lastExam.title}</div><div className="mt-1 text-xs text-muted">درصد ثبت‌شده: {computePercentDisplay(last.netCorrect, last.total)}</div></div>
            <Link to="/student/results" className="btn-primary">مشاهده جزئیات نتایج</Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
