import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import Stat from "../../components/Stat";
import Badge from "../../components/Badge";
import {
  listAttemptsAll,
  listBookingsAdminDb,
  listExamsAll,
  listNotes,
  listOrdersAll,
  listQuestions,
  listStudents,
  listWorkReportsAll,
} from "../../lib/db";
import type { Exam, Question, Attempt, WorkReport, Order } from "../../lib/types";
import type { ConsultationBooking, Profile } from "../../lib/db";

const ACTIONS = [
  { to: "/admin/exams/new", title: "ساخت آزمون جدید", detail: "آزمون بانک سؤال یا PDF بسازید.", icon: "＋" },
  { to: "/admin/students", title: "مدیریت دانش‌آموزان", detail: "مشاهده کاربران و تنظیم دسترسی‌ها.", icon: "♙" },
  { to: "/admin/private-students", title: "برنامه‌ریزی خصوصی", detail: "مدیریت مشاوران و برنامه روزانه شاگردان.", icon: "▤" },
  { to: "/admin/bookings", title: "درخواست‌های مشاوره", detail: "پیگیری درخواست‌های ثبت‌شده در سایت.", icon: "◷" },
  { to: "/admin/work-reports", title: "گزارش کارها", detail: "بررسی و تأیید گزارش‌های دانش‌آموزان.", icon: "✓" },
  { to: "/admin/orders", title: "سفارش‌های فروشگاه", detail: "مدیریت سفارش‌ها و وضعیت ارسال.", icon: "▣" },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function refresh() {
    setLoading(true);
    const results = await Promise.allSettled([
      listQuestions(),
      listExamsAll(),
      listAttemptsAll(),
      listStudents(),
      listBookingsAdminDb(),
      listWorkReportsAll(),
      listOrdersAll(),
      listNotes(),
    ]);

    const value = <T,>(index: number, fallback: T): T =>
      results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<T>).value : fallback;

    setQuestions(value(0, [] as Question[]));
    setExams(value(1, [] as Exam[]));
    setAttempts(value(2, [] as Attempt[]));
    setStudents(value(3, [] as Profile[]));
    setBookings(value(4, [] as ConsultationBooking[]));
    setReports(value(5, [] as WorkReport[]));
    setOrders(value(6, [] as Order[]));
    setNotesCount(value(7, []).length);
    setFailedCount(results.filter((result) => result.status === "rejected").length);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const published = useMemo(() => exams.filter((exam) => exam.published).length, [exams]);
  const privateStudents = useMemo(() => students.filter((student) => student.is_private_student).length, [students]);
  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === "new").length, [bookings]);
  const pendingReports = useMemo(() => reports.filter((report) => report.status === "submitted").length, [reports]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "pending").length, [orders]);

  return (
    <div className="space-y-5">
      <Card hover={false} className="admin-dashboard-hero">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-sky-700 dark:text-cyan-300">مدیریت آکادمی تاس</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black">داشبورد مدیریت</h1>
            <p className="mt-2 text-sm text-muted leading-7">نمای کلی عملکرد سامانه و دسترسی سریع به مهم‌ترین عملیات مدیریتی.</p>
            {lastUpdated ? <div className="mt-2 text-[11px] text-muted">آخرین به‌روزرسانی: {lastUpdated.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</div> : null}
          </div>
          <button className="btn-ghost shrink-0" onClick={() => void refresh()} disabled={loading} type="button">
            {loading ? "در حال به‌روزرسانی…" : "↻ به‌روزرسانی اطلاعات"}
          </button>
        </div>
      </Card>

      {failedCount > 0 ? (
        <Card hover={false}>
          <div className="text-sm font-bold text-amber-700 dark:text-amber-300">بخشی از اطلاعات دریافت نشد</div>
          <p className="mt-1 text-xs text-muted leading-6">{failedCount.toLocaleString("fa-IR")} بخش از سرویس‌های مدیریتی پاسخ ندادند. اتصال سرور را بررسی کنید و دوباره به‌روزرسانی را بزنید.</p>
        </Card>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-extrabold">نمای کلی سامانه</h2>
          {loading ? <Badge>در حال دریافت اطلاعات</Badge> : <Badge>اطلاعات زنده از سامانه</Badge>}
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Stat label="دانش‌آموزان" value={students.length.toLocaleString("fa-IR")} hint={`${privateStudents.toLocaleString("fa-IR")} دانش‌آموز خصوصی`} />
          <Stat label="آزمون‌ها" value={exams.length.toLocaleString("fa-IR")} hint={`${published.toLocaleString("fa-IR")} آزمون منتشرشده`} />
          <Stat label="بانک سؤال" value={questions.length.toLocaleString("fa-IR")} hint="سؤال‌های ثبت‌شده" />
          <Stat label="شرکت در آزمون‌ها" value={attempts.length.toLocaleString("fa-IR")} hint="تعداد کارنامه‌های ثبت‌شده" />
          <Stat label="درخواست مشاوره جدید" value={pendingBookings.toLocaleString("fa-IR")} hint={`${bookings.length.toLocaleString("fa-IR")} درخواست در مجموع`} />
          <Stat label="گزارش کار بررسی‌نشده" value={pendingReports.toLocaleString("fa-IR")} hint={`${reports.length.toLocaleString("fa-IR")} گزارش ثبت‌شده`} />
          <Stat label="سفارش در انتظار" value={pendingOrders.toLocaleString("fa-IR")} hint={`${orders.length.toLocaleString("fa-IR")} سفارش در مجموع`} />
          <Stat label="جزوه‌های فروشگاه" value={notesCount.toLocaleString("fa-IR")} hint="منابع ثبت‌شده" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-extrabold">دسترسی سریع</h2>
          <span className="text-xs text-muted">عملیات پرکاربرد مدیریت</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ACTIONS.map((action) => (
            <Link to={action.to} key={action.to} className="admin-action-card">
              <span className="admin-action-icon">{action.icon}</span>
              <span className="min-w-0">
                <span className="block font-bold text-sm">{action.title}</span>
                <span className="block mt-1 text-xs text-muted leading-6">{action.detail}</span>
              </span>
              <span className="admin-action-arrow">←</span>
            </Link>
          ))}
        </div>
      </section>

      <Card hover={false}>
        <div className="font-bold">موارد نیازمند پیگیری</div>
        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          <Link to="/admin/bookings" className="admin-followup-row">
            <span>درخواست مشاوره جدید</span><strong>{pendingBookings.toLocaleString("fa-IR")}</strong>
          </Link>
          <Link to="/admin/work-reports" className="admin-followup-row">
            <span>گزارش کار در انتظار بررسی</span><strong>{pendingReports.toLocaleString("fa-IR")}</strong>
          </Link>
          <Link to="/admin/orders" className="admin-followup-row">
            <span>سفارش در انتظار اقدام</span><strong>{pendingOrders.toLocaleString("fa-IR")}</strong>
          </Link>
        </div>
      </Card>
    </div>
  );
}
