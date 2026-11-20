import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";
import * as jalaali from "jalaali-js";

import { apiFetch } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Badge from "../../components/Badge";

interface StudyPart {
  id: string;
  time: string;
  subject: string;
  duration: string;
  testCount: string;
  description: string;
}

interface ProgressItem {
  id: number;
  subjectName: string;
  boxes: boolean[];
}

function emptyPart(i = 0): StudyPart {
  return { id: `${Date.now()}-${Math.random()}-${i}`, time: "", subject: "", duration: "", testCount: "", description: "" };
}

function toEnglishDigits(s: string) {
  return String(s || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function jalaliToGregorianStr(jalali: string) {
  const [jy, jm, jd] = toEnglishDigits(jalali).split("-").map(Number);
  const g = jalaali.toGregorian(jy, jm, jd);
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

function dateObjectToGregorian(value: any) {
  if (!value) return "";
  if (value instanceof DateObject || value?.format) return jalaliToGregorianStr(value.format("YYYY-MM-DD"));
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

function todayPersianDateValue() {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

export default function AdminPrivateStudentPlan() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const isAdvisorPanel = location.pathname.startsWith("/advisor");
  const basePath = isAdvisorPanel ? "/advisor" : "/admin";
  const { push } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<any>(todayPersianDateValue());
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [parts, setParts] = useState<StudyPart[]>(Array.from({ length: 6 }, (_, i) => emptyPart(i)));
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = useMemo(() => dateObjectToGregorian(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!userId) return;
    void loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, basePath]);

  useEffect(() => {
    if (!userId || !dateStr) return;
    void loadPlan(dateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateStr, basePath]);

  async function loadBaseData() {
    try {
      const userRes = await apiFetch(`${basePath}/users/${userId}`);
      setStudent(userRes);

      const progRes = await apiFetch(`${basePath}/private-students/${userId}/progress`);
      setProgress((progRes?.progresses || []).map((p: any) => ({ ...p, id: Number(p.id) })));
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "خطا در دریافت اطلاعات دانش‌آموز" });
    }
  }

  async function loadPlan(date: string) {
    setLoading(true);
    try {
      const res = await apiFetch(`${basePath}/private-students/${userId}/plans?date=${encodeURIComponent(date)}`);
      if (res?.plan) {
        setCurrentPlanId(res.plan.id);
        const rows = (res.plan.rows || []).map((r: any) => ({
          id: String(r.id || `${Date.now()}-${Math.random()}`),
          time: r.time || "",
          subject: r.subjectName || "",
          duration: r.duration ? String(r.duration) : "",
          testCount: r.testCount ? String(r.testCount) : "0",
          description: r.description || "",
        }));
        setParts(rows.length ? rows : Array.from({ length: 6 }, (_, i) => emptyPart(i)));
      } else {
        setCurrentPlanId(null);
        setParts(Array.from({ length: 6 }, (_, i) => emptyPart(i)));
      }
      if (res?.progresses) setProgress(res.progresses.map((p: any) => ({ ...p, id: Number(p.id) })));
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "خطا در بارگذاری برنامه" });
    } finally {
      setLoading(false);
    }
  }

  function updatePart(id: string, field: keyof StudyPart, value: string) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function addPart() {
    setParts((prev) => [...prev, emptyPart(prev.length)]);
  }

  function removePart(id: string) {
    setParts((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
  }

  async function savePlan() {
    if (!dateStr) return;
    setSaving(true);
    try {
      const rowsPayload = parts
        .filter((p) => p.subject.trim() || p.description.trim())
        .map((p, index) => ({
          time: p.time.trim(),
          subjectName: p.subject.trim() || "بدون عنوان",
          duration: Number(p.duration || 0),
          testCount: Number(p.testCount || 0),
          description: p.description.trim(),
          orderIndex: index + 1,
        }));

      await apiFetch(`${basePath}/private-students/${userId}/plans`, {
        method: "POST",
        body: { date: dateStr, rows: rowsPayload },
      });

      push({ type: "success", title: "ثبت شد", message: "برنامه مستقیم در پنل دانش‌آموز ذخیره شد." });
      await loadPlan(dateStr);
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "خطا در ذخیره برنامه" });
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan() {
    if (!currentPlanId || !userId) return;
    if (!confirm("برنامه این تاریخ حذف شود؟")) return;
    try {
      await apiFetch(`${basePath}/private-students/${userId}/plans/${currentPlanId}`, { method: "DELETE" });
      push({ type: "success", title: "حذف شد", message: "برنامه حذف شد." });
      setCurrentPlanId(null);
      setParts(Array.from({ length: 6 }, (_, i) => emptyPart(i)));
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "حذف برنامه ناموفق بود" });
    }
  }

  async function addProgressSubject() {
    const name = prompt("نام درس جدید:");
    if (!name?.trim()) return;
    try {
      const res = await apiFetch(`${basePath}/private-students/${userId}/progress`, { method: "POST", body: { subjectName: name.trim() } });
      setProgress((prev) => [...prev.filter((p) => p.id !== Number(res.id)), { ...res, id: Number(res.id) }]);
      push({ type: "success", title: "درس اضافه شد" });
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "افزودن درس ناموفق بود" });
    }
  }

  async function addBoxToSubject(id: number) {
    const res = await apiFetch(`${basePath}/private-students/${userId}/progress/${id}/add-box`, { method: "PATCH" });
    setProgress((prev) => prev.map((p) => (p.id === id ? { ...res, id: Number(res.id) } : p)));
  }

  async function toggleBox(id: number, index: number) {
    const res = await apiFetch(`${basePath}/private-students/${userId}/progress/${id}/toggle`, { method: "PATCH", body: { index } });
    setProgress((prev) => prev.map((p) => (p.id === id ? { ...res, id: Number(res.id) } : p)));
  }

  async function deleteProgress(id: number) {
    if (!confirm("این درس از لیست پیشرفت حذف شود؟")) return;
    await apiFetch(`${basePath}/private-students/${userId}/progress/${id}`, { method: "DELETE" });
    setProgress((prev) => prev.filter((p) => p.id !== id));
  }

  const profile = student?.profile || {};

  return (
    <Container className="py-8 space-y-6">
      <Card hover={false} className="p-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <div className="text-xs text-muted">{isAdvisorPanel ? "پنل مشاور" : "پنل ادمین"}</div>
            <h1 className="text-2xl font-black mt-1">برنامه‌نویسی دانش‌آموز خصوصی</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="primary">نام: {profile.name || "—"}</Badge>
              <Badge variant="info">مشاور: {student?.privateAdvisorName || "—"}</Badge>
              <Badge>پایه: {profile.grade || "—"}</Badge>
              <Badge>شماره: {profile.phone || "—"}</Badge>
              <Badge>تمدید: {student?.privateRenewalDate || "—"}</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="text-sm font-semibold">
              تاریخ برنامه
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-right"
                inputClass="input mt-2 min-w-[190px] text-center"
              />
            </label>
            <button className="btn-ghost" onClick={addPart} type="button">+ افزودن پارت</button>
            <button className="btn-primary" onClick={savePlan} disabled={saving || loading} type="button">
              {saving ? "در حال ذخیره..." : "ذخیره مستقیم در پنل دانش‌آموز"}
            </button>
            {currentPlanId ? <button className="btn-ghost text-rose-600" onClick={deletePlan} type="button">حذف برنامه</button> : null}
          </div>
        </div>
      </Card>

      <Card hover={false} className="p-0 overflow-hidden">
        {loading ? <div className="p-5 text-sm text-muted">در حال بارگذاری برنامه…</div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.7)" }}>
                <th className="p-3 text-right w-24">زمان</th>
                <th className="p-3 text-right w-56">درس / فعالیت</th>
                <th className="p-3 text-right w-28">مدت</th>
                <th className="p-3 text-right w-28">تست</th>
                <th className="p-3 text-right">توضیحات برنامه</th>
                <th className="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={part.id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                  <td className="p-3 align-top">
                    <input className="input text-center h-12" placeholder="08:00" value={part.time} onChange={(e) => updatePart(part.id, "time", e.target.value)} />
                  </td>
                  <td className="p-3 align-top">
                    <input className="input h-12 font-bold" placeholder="مثلاً ریاضی" value={part.subject} onChange={(e) => updatePart(part.id, "subject", e.target.value)} />
                  </td>
                  <td className="p-3 align-top">
                    <input className="input text-center h-12" placeholder="دقیقه" inputMode="numeric" value={part.duration} onChange={(e) => updatePart(part.id, "duration", e.target.value)} />
                  </td>
                  <td className="p-3 align-top">
                    <input className="input text-center h-12" placeholder="تعداد" inputMode="numeric" value={part.testCount} onChange={(e) => updatePart(part.id, "testCount", e.target.value)} />
                  </td>
                  <td className="p-3 align-top">
                    <textarea
                      className="input min-h-[96px] leading-7 resize-y"
                      placeholder="جزئیات برنامه، منبع، صفحات، نکات مشاور..."
                      value={part.description}
                      onChange={(e) => updatePart(part.id, "description", e.target.value)}
                    />
                  </td>
                  <td className="p-3 align-top text-center">
                    <div className="text-xs text-muted mb-2">#{(index + 1).toLocaleString("fa-IR")}</div>
                    <button className="btn-ghost text-rose-600" onClick={() => removePart(part.id)} type="button">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card hover={false} className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-black">وضعیت پیشرفت دروس</h2>
            <p className="text-sm text-muted mt-1">مربع‌ها برای پیگیری وضعیت هر درس استفاده می‌شوند.</p>
          </div>
          <button onClick={addProgressSubject} className="btn-primary" type="button">+ افزودن درس</button>
        </div>

        {progress.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted" style={{ borderColor: "rgb(var(--border))" }}>
            هنوز درسی برای پیگیری اضافه نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {progress.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4 flex flex-col md:flex-row gap-4 md:items-center" style={{ borderColor: "rgb(var(--border))" }}>
                <div className="md:w-52 flex items-center justify-between gap-2">
                  <div className="font-black">{item.subjectName}</div>
                  <button className="text-xs text-rose-600" onClick={() => void deleteProgress(item.id)} type="button">حذف</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(item.boxes || []).map((checked, idx) => (
                    <button
                      key={idx}
                      onClick={() => void toggleBox(item.id, idx)}
                      className={`w-10 h-10 rounded-xl border-2 ${checked ? "bg-amber-400 border-amber-500" : "bg-background"}`}
                      style={{ borderColor: checked ? undefined : "rgb(var(--border))" }}
                      type="button"
                    />
                  ))}
                  <button className="w-10 h-10 rounded-xl border border-dashed text-lg" onClick={() => void addBoxToSubject(item.id)} type="button" style={{ borderColor: "rgb(var(--border))" }}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
