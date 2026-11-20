import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { apiFetch } from "../../lib/api";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

function toDateString(value: Value | null) {
  if (!value || Array.isArray(value)) return "";
  if (value instanceof DateObject) return value.format("YYYY-MM-DD");
  return "";
}

function todayPersianDateValue() {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

export default function StudentPlan() {
  const [selectedDate, setSelectedDate] = useState<Value>(todayPersianDateValue());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dateStr = useMemo(() => toDateString(selectedDate), [selectedDate]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!dateStr) return;
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(`/api/me/private-plan?date=${encodeURIComponent(dateStr)}`);
        if (!ignore) setData(response);
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || "دریافت برنامه ناموفق بود.");
          setData(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => { ignore = true; };
  }, [dateStr]);

  const rows = data?.plan?.rows || [];
  const user = data?.user || {};

  return (
    <div className="space-y-4">
      <Card hover={false} className="admin-dashboard-hero">
        <div className="text-xs text-muted">پنل دانش‌آموز</div>
        <h1 className="mt-2 text-2xl font-extrabold">برنامه درسی اختصاصی</h1>
        <p className="mt-2 text-sm text-muted leading-7">برنامه روزانه ثبت‌شده توسط مشاور را مشاهده و پیگیری کن. برنامه‌های آینده تا سه روز بعد قابل مشاهده‌اند.</p>
      </Card>

      <Card hover={false}>
        <div className="grid lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-semibold">انتخاب تاریخ</label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              inputClass="input"
              containerClassName="w-full"
            />
          </div>
          {data?.isPrivateStudent ? (
            <div className="lg:col-span-8 flex flex-wrap gap-2">
              <Badge variant="primary">دانش‌آموز: {user.name || "—"}</Badge>
              <Badge variant="info">مشاور: {user.advisorName || "—"}</Badge>
              <Badge>پایه: {user.grade || "—"}</Badge>
              <Badge>شماره: {user.phone || "—"}</Badge>
              <Badge>تمدید: {user.renewalDate || "—"}</Badge>
            </div>
          ) : null}
        </div>

        {loading ? <div className="mt-5 rounded-2xl p-4 text-sm text-muted" style={{ background: "rgb(var(--bg-2))" }}>در حال دریافت برنامه…</div> : null}
        {error ? <div className="mt-5 rounded-2xl p-4 text-sm text-rose-600 border border-rose-200 bg-rose-50">{error}</div> : null}

        {!loading && !error && data && !data.isPrivateStudent ? (
          <div className="mt-5 rounded-2xl p-5 text-sm" style={{ background: "rgb(var(--accent-soft))", color: "rgb(var(--accent-3))" }}>این بخش برای دانش‌آموزان دارای برنامه خصوصی فعال است. برای فعال‌سازی با مشاور مجموعه هماهنگ کنید.</div>
        ) : null}

        {!loading && !error && data?.isPrivateStudent && data?.canViewDate === false ? (
          <div className="mt-5 rounded-2xl p-5 text-sm" style={{ background: "rgb(var(--accent-soft))", color: "rgb(var(--accent-3))" }}>برنامه‌های آینده فقط تا سه روز بعد قابل مشاهده‌اند. آخرین تاریخ مجاز: {data.limitDate}</div>
        ) : null}

        {!loading && !error && data?.isPrivateStudent && data?.canViewDate !== false && rows.length === 0 ? (
          <div className="mt-5 rounded-2xl p-7 text-center" style={{ background: "rgb(var(--bg-2))" }}>
            <div className="text-2xl">📘</div><p className="mt-2 text-sm text-muted">برای این تاریخ برنامه‌ای ثبت نشده است.</p>
          </div>
        ) : null}

        {data?.isPrivateStudent && data?.canViewDate !== false && rows.length > 0 ? (
          <div className="mt-5 space-y-3">
            {rows.map((row: any, index: number) => (
              <div key={row.id || `${row.subjectName}-${index}`} className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / .5)" }}>
                <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-bold">{(index + 1).toLocaleString("fa-IR")}. {row.subjectName}</div>
                  <div className="flex gap-2 flex-wrap">
                    {row.time ? <Badge>{row.time}</Badge> : null}
                    <Badge variant="info">{(row.duration || 0).toLocaleString("fa-IR")} دقیقه</Badge>
                    <Badge>{(row.testCount || 0).toLocaleString("fa-IR")} تست</Badge>
                  </div>
                </div>
                {row.description ? <p className="text-sm leading-8 text-muted whitespace-pre-line">{row.description}</p> : <p className="text-sm text-muted">توضیحی برای این فعالیت ثبت نشده است.</p>}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
