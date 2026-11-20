import React, { useCallback, useEffect, useState } from "react";
import {
  getMyActiveCompetition,
  submitDailyRecord,
  getLeaderboard,
  type Competition,
  type CompetitionParticipant,
  type CompetitionDailyRecord,
} from "../api/competition";
import Card from "../components/Card";
import Badge from "../components/Badge";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export default function StudentCompetition() {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participant, setParticipant] = useState<CompetitionParticipant | null>(null);
  const [todayRecord, setTodayRecord] = useState<CompetitionDailyRecord | null>(null);
  const [leaderboard, setLeaderboard] = useState<CompetitionParticipant[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ studyMinutes: "", correctCount: "", wrongCount: "", emptyCount: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMyActiveCompetition();
      setCompetition(result.competition);
      setParticipant(result.participant);
      setTodayRecord(result.todayRecord);
      setLeaderboard(result.leaderboard || []);
      if (result.competition) {
        const ranking = await getLeaderboard(result.competition.id);
        setLeaderboard(ranking.leaderboard || []);
        setMyRank(ranking.myRank);
      } else {
        setMyRank(null);
      }
    } catch (err: any) {
      setError(err?.message || "دریافت اطلاعات رقابت ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (value !== "" && (!/^\d+$/.test(value) || Number(value) < 0)) return;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!competition || !participant) return;
    const studyMinutes = Number(form.studyMinutes);
    if (!Number.isInteger(studyMinutes) || studyMinutes <= 0) {
      setError("مدت مطالعه را به دقیقه و به‌صورت عددی بزرگ‌تر از صفر وارد کنید.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitDailyRecord(competition.id, {
        studyMinutes,
        correctCount: Number(form.correctCount) || 0,
        wrongCount: Number(form.wrongCount) || 0,
        emptyCount: Number(form.emptyCount) || 0,
      });
      setForm({ studyMinutes: "", correctCount: "", wrongCount: "", emptyCount: "" });
      await load();
    } catch (err: any) {
      setError(err?.message || "ثبت رکورد روزانه ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Card hover={false}><div className="py-6 text-sm text-muted">در حال دریافت اطلاعات رقابت…</div></Card>;

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="text-xs text-muted">پنل دانش‌آموز</div>
            <h1 className="mt-2 text-2xl font-extrabold">رقابت و دوئل مطالعاتی</h1>
            <p className="mt-2 text-sm text-muted leading-7">زمان مطالعه و عملکرد روزانه‌ات را ثبت کن و جایگاهت را در جدول رقابت ببین.</p>
          </div>
          <button className="btn-ghost" type="button" onClick={() => void load()}>به‌روزرسانی</button>
        </div>
      </Card>

      {error ? <Card hover={false}><div className="text-sm text-rose-600 leading-7">{error}</div></Card> : null}

      {!competition ? (
        <Card hover={false}>
          <div className="py-7 text-center">
            <div className="text-4xl">🏁</div>
            <div className="mt-3 font-extrabold">در حال حاضر رقابت فعالی وجود ندارد</div>
            <p className="mt-2 text-sm text-muted">با آغاز رقابت جدید، اطلاعات آن در این صفحه نمایش داده می‌شود.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card hover={false} className="admin-dashboard-hero">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted">رقابت فعال</div>
                <h2 className="mt-2 text-xl font-extrabold">{competition.title}</h2>
                {competition.description ? <p className="mt-2 text-sm text-muted leading-7">{competition.description}</p> : null}
              </div>
              <Badge>در حال برگزاری</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
              <span className="chip">شروع: {dateLabel(competition.startDate)}</span>
              <span className="chip">پایان: {dateLabel(competition.endDate)}</span>
            </div>
          </Card>

          {!participant ? (
            <Card hover={false}>
              <div className="font-bold">عضویت در رقابت</div>
              <p className="mt-2 text-sm text-muted leading-7">حساب شما هنوز به این رقابت اضافه نشده است. برای ثبت‌نام با مشاور یا مدیر مجموعه هماهنگ کنید.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="stat-card"><div className="text-xs text-muted">مجموع مطالعه</div><div className="mt-2 text-2xl font-black">{participant.totalStudyMinutes.toLocaleString("fa-IR")}</div><div className="mt-1 text-[11px] text-muted">دقیقه</div></div>
                <div className="stat-card"><div className="text-xs text-muted">تست صحیح</div><div className="mt-2 text-2xl font-black">{participant.totalCorrect.toLocaleString("fa-IR")}</div></div>
                <div className="stat-card"><div className="text-xs text-muted">تست غلط</div><div className="mt-2 text-2xl font-black">{participant.totalWrong.toLocaleString("fa-IR")}</div></div>
                <div className="stat-card"><div className="text-xs text-muted">رتبه فعلی</div><div className="mt-2 text-2xl font-black">{myRank ? myRank.toLocaleString("fa-IR") : "—"}</div></div>
              </div>

              <Card hover={false}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-extrabold">ثبت عملکرد امروز</h3>
                    <p className="mt-1 text-xs text-muted">اطلاعات مطالعه و تست‌های امروز را ثبت کن.</p>
                  </div>
                  {todayRecord ? <Badge>امروز ثبت شده</Badge> : <Badge>در انتظار ثبت</Badge>}
                </div>
                {todayRecord ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-xs text-muted">مطالعه</div><div className="mt-1 font-bold">{todayRecord.studyMinutes.toLocaleString("fa-IR")} دقیقه</div></div>
                    <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-xs text-muted">صحیح</div><div className="mt-1 font-bold">{todayRecord.correctCount.toLocaleString("fa-IR")}</div></div>
                    <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-xs text-muted">غلط</div><div className="mt-1 font-bold">{todayRecord.wrongCount.toLocaleString("fa-IR")}</div></div>
                    <div className="rounded-xl p-3" style={{ background: "rgb(var(--bg-2))" }}><div className="text-xs text-muted">نزده</div><div className="mt-1 font-bold">{todayRecord.emptyCount.toLocaleString("fa-IR")}</div></div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <label className="text-sm">دقیقه مطالعه<input className="input mt-1" type="number" min="1" name="studyMinutes" value={form.studyMinutes} onChange={onChange} required placeholder="مثلاً ۳۰۰" /></label>
                    <label className="text-sm">تست صحیح<input className="input mt-1" type="number" min="0" name="correctCount" value={form.correctCount} onChange={onChange} placeholder="۰" /></label>
                    <label className="text-sm">تست غلط<input className="input mt-1" type="number" min="0" name="wrongCount" value={form.wrongCount} onChange={onChange} placeholder="۰" /></label>
                    <label className="text-sm">تست نزده<input className="input mt-1" type="number" min="0" name="emptyCount" value={form.emptyCount} onChange={onChange} placeholder="۰" /></label>
                    <button className="btn-primary sm:col-span-2 xl:col-span-4" type="submit" disabled={submitting}>{submitting ? "در حال ثبت…" : "ثبت رکورد امروز"}</button>
                  </form>
                )}
              </Card>
            </>
          )}

          <Card hover={false}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div><h3 className="font-extrabold">جدول رتبه‌بندی</h3><p className="mt-1 text-xs text-muted">جایگاه شرکت‌کنندگان بر اساس رکوردهای ثبت‌شده</p></div>
              <Badge>{leaderboard.length.toLocaleString("fa-IR")} شرکت‌کننده</Badge>
            </div>
            {leaderboard.length === 0 ? <p className="mt-4 text-sm text-muted">هنوز رکوردی برای نمایش ثبت نشده است.</p> : (
              <div className="mt-4 overflow-x-auto rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }}>
                <table className="w-full min-w-[650px] text-sm">
                  <thead style={{ background: "rgb(var(--bg-2))" }}><tr><th className="p-3 text-right">رتبه</th><th className="p-3 text-right">شناسه دانش‌آموز</th><th className="p-3 text-right">دقیقه مطالعه</th><th className="p-3 text-right">صحیح</th><th className="p-3 text-right">غلط</th><th className="p-3 text-right">نزده</th></tr></thead>
                  <tbody>{leaderboard.map((row, index) => <tr key={row.id} style={row.studentId === participant?.studentId ? { background: "rgb(var(--accent-soft) / .55)" } : undefined}><td className="p-3 font-bold">{(index + 1).toLocaleString("fa-IR")}</td><td className="p-3" dir="ltr">{row.studentId}</td><td className="p-3">{row.totalStudyMinutes.toLocaleString("fa-IR")}</td><td className="p-3">{row.totalCorrect.toLocaleString("fa-IR")}</td><td className="p-3">{row.totalWrong.toLocaleString("fa-IR")}</td><td className="p-3">{row.totalEmpty.toLocaleString("fa-IR")}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
