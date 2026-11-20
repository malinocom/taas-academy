import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCompetitions, createCompetition, type Competition } from "../../api/competition";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";

type DateValue = any;
type DateField = "startDate" | "endDate";

function toGregorianIsoString(dateObject: DateValue | null, endOfDay = false) {
  if (!dateObject) return "";
  const value = dateObject.convert(gregorian);
  return new Date(Date.UTC(
    value.year,
    value.month - 1,
    value.day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  )).toISOString();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function statusText(status: Competition["status"]) {
  if (status === "active") return "در حال برگزاری";
  if (status === "finished") return "پایان‌یافته";
  if (status === "draft") return "پیش‌نویس";
  return "در انتظار شروع";
}

const AdminCompetitions: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDateObject: null as DateValue | null,
    endDateObject: null as DateValue | null,
    startDateISO: "",
    endDateISO: "",
  });

  const loadCompetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listCompetitions();
      setCompetitions(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.message || "دریافت فهرست رقابت‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCompetitions(); }, []);

  const handleDateChange = (field: DateField, value: DateValue | null) => {
    const iso = toGregorianIsoString(value, field === "endDate");
    setForm((previous) => ({
      ...previous,
      [`${field}Object`]: value,
      [`${field}ISO`]: iso,
    }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.startDateISO || !form.endDateISO) {
      setError("عنوان، تاریخ شروع و تاریخ پایان را کامل کنید.");
      return;
    }
    if (new Date(form.endDateISO) <= new Date(form.startDateISO)) {
      setError("تاریخ پایان باید بعد از تاریخ شروع باشد.");
      return;
    }

    setSubmitting(true);
    try {
      await createCompetition({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDateISO,
        endDate: form.endDateISO,
      });
      setForm({ title: "", description: "", startDateObject: null, endDateObject: null, startDateISO: "", endDateISO: "" });
      await loadCompetitions();
    } catch (err: any) {
      setError(err?.message || "ایجاد رقابت ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="py-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-muted">پنل مدیریت</div>
            <h1 className="mt-1 text-2xl font-extrabold">مدیریت رقابت‌ها</h1>
            <p className="mt-2 text-sm text-muted">ساخت رقابت، ثبت شرکت‌کنندگان و بررسی جدول رتبه‌بندی.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => void loadCompetitions()} disabled={loading}>به‌روزرسانی</button>
        </div>

        <Card hover={false}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-extrabold">ایجاد رقابت جدید</h2>
            <Badge variant="info">تاریخ شمسی</Badge>
          </div>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              عنوان رقابت
              <input value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} className="input" required maxLength={160} placeholder="مثلاً رقابت جمع‌بندی آزمون جامع" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold md:col-span-2">
              توضیحات و قوانین
              <textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} className="textarea" rows={3} maxLength={2000} placeholder="قوانین و توضیح کوتاه رقابت را بنویسید…" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              تاریخ شروع
              <DatePicker calendar={persian} locale={persian_fa} value={form.startDateObject} onChange={(value: DateValue) => handleDateChange("startDate", value)} format="YYYY/MM/DD" inputClass="input" placeholder="۱۴۰۵/۰۸/۱۰" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              تاریخ پایان
              <DatePicker calendar={persian} locale={persian_fa} value={form.endDateObject} onChange={(value: DateValue) => handleDateChange("endDate", value)} format="YYYY/MM/DD" inputClass="input" placeholder="۱۴۰۵/۰۸/۳۰" />
            </label>
            {error ? <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "در حال ایجاد…" : "ایجاد رقابت"}</button>
            </div>
          </form>
        </Card>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-extrabold">فهرست رقابت‌ها</h2>
            <Badge>{competitions.length.toLocaleString("fa-IR")} رقابت</Badge>
          </div>
          {loading ? <Card hover={false}><div className="text-sm text-muted">در حال دریافت فهرست…</div></Card> : null}
          {!loading && competitions.length === 0 ? <Card hover={false}><div className="py-5 text-center text-sm text-muted">هنوز رقابتی ایجاد نشده است.</div></Card> : null}
          <div className="grid md:grid-cols-2 gap-3">
            {competitions.map((competition) => (
              <Card key={competition.id} hover={false}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="font-extrabold">{competition.title}</h3><p className="mt-2 text-xs text-muted leading-6">{competition.description || "بدون توضیحات"}</p></div>
                  <Badge variant={competition.status === "active" ? "primary" : "default"}>{statusText(competition.status)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-[11px] text-muted">شروع</div><div className="mt-1 text-sm font-bold">{formatDate(competition.startDate)}</div></div>
                  <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-[11px] text-muted">پایان</div><div className="mt-1 text-sm font-bold">{formatDate(competition.endDate)}</div></div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{(competition.participantCount || 0).toLocaleString("fa-IR")} شرکت‌کننده</span>
                  <Link to={`/admin/competitions/${competition.id}`} className="btn-primary">مدیریت رقابت</Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
};

export default AdminCompetitions;
