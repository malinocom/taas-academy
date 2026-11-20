import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import { useToast } from "../../context/ToastContext";
import type { Exam, SubjectRange } from "../../lib/types";
import { createExamDb, listStudents, uploadSingleDb } from "../../lib/db";
import * as XLSX from "xlsx";
import { toGregorian } from "jalaali-js";
import PdfReader from "../../components/PdfReader";

type StudentProfile = {
  user_id: string;
  name: string;
  email: string;
};

function normalizeDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(input ?? "");
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  s = s.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  return s;
}

function normalizeCorrect(v: any): number | null {
  if (v === null || v === undefined) return null;
  const s = normalizeDigits(String(v).trim());
  if (!s) return null;

  // numeric
  const n = Number(s);
if (Number.isFinite(n)) {
  if (n >= 1 && n <= 4) return n - 1;
  if (n >= 0 && n <= 3) return n;
}

  const t = s.toLowerCase();
  if (["a", "1", "الف"].includes(t)) return 0;
  if (["b", "2", "ب"].includes(t)) return 1;
  if (["c", "3", "ج"].includes(t)) return 2;
  if (["d", "4", "د"].includes(t)) return 3;

  const m = t.match(/(\d+)/);
  if (m) {
    const k = Number(m[1]);
    if (k >= 1 && k <= 4) return k - 1;
    if (k >= 0 && k <= 3) return k;
  }

  return null;
}
function parseJalaliDateTime(input: string): string | null {
  const s = normalizeDigits((input || '').trim());
  if (!s) return null;

  // 1404/01/20 14:30
  const m = s.match(/^(\d{3,4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (!m) return null;

  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  const hh = m[4] ? Number(m[4]) : 0;
  const mm = m[5] ? Number(m[5]) : 0;

  // تبدیل شمسی به میلادی
  const g = toGregorian(jy, jm, jd);

  // ساخت زمان با timezone ایران
  const dt = new Date(Date.UTC(g.gy, g.gm - 1, g.gd, hh - 3, mm)); 
  // 🎯 نکته: ایران UTC+3:30 است. 
  // اگر بخواهیم زمان شمسی 14:30 به UTC تبدیل شود → 11:00 UTC

  return dt.toISOString();
}


async function parseAnswerKeyExcel(file: File): Promise<{ answerKey: Record<string, number>; questionCount: number }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" }) as any[][];
  if (!rows.length) throw new Error("اکسل خالی است");

  const answerKey: Record<string, number> = {};

  // Horizontal format: first row = question numbers, second row = answers
  if (rows.length >= 2 && rows[0].length >= 3 && rows[1].length >= 3) {
    let numericHeaders = 0;
    for (const cell of rows[0]) {
      const n = Number(String(cell).trim());
      if (Number.isFinite(n) && n >= 1) numericHeaders += 1;
    }
    if (numericHeaders >= Math.min(10, rows[0].length - 1)) {
      for (let i = 0; i < rows[0].length; i++) {
        const qNo = Number(normalizeDigits(String(rows[0][i] ?? "").trim()));

        if (!Number.isFinite(qNo) || qNo < 1) continue;
        const idx = normalizeCorrect(rows[1][i]);
        if (idx === null) continue;
        answerKey[String(qNo)] = idx;
      }
      const qc = Math.max(0, ...Object.keys(answerKey).map((k) => Number(k)).filter((x) => Number.isFinite(x)));
      if (!qc) throw new Error("هیچ کلید پاسخی از اکسل استخراج نشد");
      return { answerKey, questionCount: qc };
    }
  }

  // Vertical format: each row = number + correct
  const header = (rows[0] || []).map((x) => String(x).trim());
  const findIdx = (re: RegExp) => header.findIndex((h) => re.test(h));
  let noIdx = findIdx(/^(no|q|question|شماره|سوال)/i);
  let ansIdx = findIdx(/(answer|correct|key|گزینه|پاسخ|کلید)/i);
  if (noIdx < 0 && header.length === 2) noIdx = 0;
  if (ansIdx < 0 && header.length === 2) ansIdx = 1;
  if (noIdx < 0 || ansIdx < 0) {
    // fallback: first two columns
    noIdx = 0;
    ansIdx = 1;
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const qNo = Number(String(row[noIdx] ?? "").trim());
    if (!Number.isFinite(qNo) || qNo < 1) continue;
    const idx = normalizeCorrect(row[ansIdx]);
    if (idx === null) continue;
    answerKey[String(qNo)] = idx;
  }

  const qc = Math.max(0, ...Object.keys(answerKey).map((k) => Number(k)).filter((x) => Number.isFinite(x)));
  if (!qc) throw new Error("هیچ کلید پاسخی از اکسل استخراج نشد");
  return { answerKey, questionCount: qc };
}

export default function AdminExamBuilder() {
  const { push } = useToast();
  const nav = useNavigate();

  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("آزمون PDF جدید");
  const [description, setDescription] = useState("آزمون ساخته شده توسط ادمین");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [published, setPublished] = useState(true);
  const [negativeEnabled, setNegativeEnabled] = useState(false);

  const [startJalali, setStartJalali] = useState("");
  const [endJalali, setEndJalali] = useState("");

  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");

  const [answerKey, setAnswerKey] = useState<Record<string, number>>({});
  const [questionCount, setQuestionCount] = useState<number>(0);

  const [ranges, setRanges] = useState<SubjectRange[]>([
    { from: 1, to: 20, subject: "جامعه" },
    { from: 21, to: 35, subject: "ریاضی" },
  ]);

  const [assignMode, setAssignMode] = useState<"all" | "selected">("selected");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const ss: any = await listStudents();
        setStudents((ss || []).map((s: any) => ({ user_id: s.user_id, name: s.name, email: s.email })));
      } catch {
        // ignore
      }
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q));
  }, [students, studentQuery]);

  function toggleStudent(userId: string) {
    setSelectedStudents((prev) => (prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]));
  }

  function addRange() {
    setRanges((prev) => [...prev, { from: 1, to: 1, subject: "" }]);
  }

  function updateRange(i: number, patch: Partial<SubjectRange>) {
    setRanges((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch } as SubjectRange;
      return next;
    });
  }

  function removeRange(i: number) {
    setRanges((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onPickPdf(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      push({ type: "error", title: "حجم فایل زیاد است", message: "حداکثر حجم PDF برابر ۲۵ مگابایت است." });
      return;
    }
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      push({ type: "error", title: "فایل نامعتبر", message: "فقط فایل PDF انتخاب کنید." });
      return;
    }
    setPdfFileName(file.name);
    setPdfUrl("");
    try {
      setBusy(true);
      const r = await uploadSingleDb(file, "exams");
      setPdfUrl(r.url);
      push({ type: "success", title: "PDF آپلود شد", message: "فایل آزمون با موفقیت آپلود شد." });
    } catch (e: any) {
      push({ type: "error", title: "آپلود ناموفق", message: e?.message ?? "آپلود PDF ناموفق بود" });
      setPdfUrl("");
    } finally {
      setBusy(false);
    }
  }

  async function onPickKey(file: File) {
    try {
      const r = await parseAnswerKeyExcel(file);
      setAnswerKey(r.answerKey);
      setQuestionCount(r.questionCount);
      push({ type: "success", title: "اکسل خوانده شد", message: `${Object.keys(r.answerKey).length.toLocaleString("fa-IR")} پاسخ استخراج شد.` });
    } catch (e: any) {
      push({ type: "error", title: "اکسل نامعتبر", message: e?.message ?? "خواندن اکسل ناموفق بود" });
      setAnswerKey({});
      setQuestionCount(0);
    }
  }

  async function createExam() {
    if (!title.trim()) return push({ type: "error", title: "نامعتبر", message: "عنوان آزمون را وارد کنید." });
    if (!pdfUrl) return push({ type: "error", title: "نامعتبر", message: "ابتدا فایل PDF آزمون را آپلود کنید." });
    if (!Object.keys(answerKey).length) return push({ type: "error", title: "نامعتبر", message: "ابتدا فایل اکسل پاسخنامه را انتخاب کنید." });
    if (!questionCount) return push({ type: "error", title: "نامعتبر", message: "تعداد سوالات مشخص نیست." });

    if (durationMinutes <= 0) return push({ type: "error", title: "نامعتبر", message: "مدت آزمون معتبر نیست." });

    if (assignMode === "selected" && selectedStudents.length === 0) {
      return push({ type: "error", title: "نامعتبر", message: "حداقل یک دانش‌آموز را انتخاب کنید یا حالت «برای همه» را بزنید." });
    }

    // ranges validation
    for (const r of ranges) {
      if (!r.subject.trim()) return push({ type: "error", title: "نامعتبر", message: "نام درس در بازه‌ها خالی است." });
      if (r.from < 1 || r.to < r.from) return push({ type: "error", title: "نامعتبر", message: "بازه درس‌ها نامعتبر است." });
    }

    const startAt = startJalali.trim() ? parseJalaliDateTime(startJalali.trim()) : null;
    const endAt = endJalali.trim() ? parseJalaliDateTime(endJalali.trim()) : null;
    if ((startJalali.trim() && !startAt) || (endJalali.trim() && !endAt)) {
      return push({ type: "error", title: "نامعتبر", message: "فرمت تاریخ/ساعت شمسی نامعتبر است. مثال: 1404/01/20 14:30" });
    }

    const exam: Exam = {
      id: "",
      title: title.trim(),
      description: description.trim(),
      mode: "pdf",
      startAt: startAt ?? undefined,
      endAt: endAt ?? undefined,
      durationMinutes,
      questionIds: [],
      blueprint: [],
      negativeMarking: { enabled: negativeEnabled, wrongPerPenalty: 3 },
      pdfUrl,
      pdfFileName: pdfFileName || undefined,
      questionCount,
      answerKey,
      subjectRanges: ranges,
      assignedUserIds: assignMode === "all" ? [] : selectedStudents,
      published,
      createdAt: new Date().toISOString()
    };

    try {
      setBusy(true);
      await createExamDb(exam);
      push({ type: "success", title: "ثبت شد", message: "آزمون PDF ساخته شد." });
      nav("/admin");
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ساخت آزمون ناموفق بود" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <div className="text-2xl font-extrabold">ساخت آزمون (PDF)</div>
        <div className="mt-2 text-sm text-muted leading-7">ادمین فایل PDF آزمون را آپلود می‌کند و کلید پاسخ‌ها فقط از طریق فایل اکسل وارد می‌شود.</div>
      </Card>

      <Card hover={false}>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            عنوان آزمون
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-sm">
            مدت آزمون (دقیقه)
            <input className="input mt-1" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value || 0))} />
          </label>
          <label className="text-sm flex items-center gap-2 mt-6 md:mt-0">
            <input type="checkbox" checked={negativeEnabled} onChange={(e) => setNegativeEnabled(e.target.checked)} />
            <span>نمره منفی (فرمول: (۳×صحیح − غلط) ÷ (۳×کل) )</span>
          </label>
          <label className="text-sm md:col-span-2">
            توضیحات
            <textarea className="textarea mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
            <label className="text-sm">
              شروع (شمسی)
              <input className="input mt-1" placeholder="مثال: 1404/01/20 14:30" value={startJalali} onChange={(e) => setStartJalali(e.target.value)} />
            </label>
            <label className="text-sm">
              پایان (شمسی)
              <input className="input mt-1" placeholder="مثال: 1404/01/20 16:30" value={endJalali} onChange={(e) => setEndJalali(e.target.value)} />
            </label>
          </div>

          <label className="text-sm">
            وضعیت انتشار
            <select className="input mt-1" value={published ? "1" : "0"} onChange={(e) => setPublished(e.target.value === "1")}>
              <option value="1">منتشر شده</option>
              <option value="0">پیش‌نویس (مخفی)</option>
            </select>
          </label>

          <label className="text-sm">
            تخصیص آزمون
            <select className="input mt-1" value={assignMode} onChange={(e) => setAssignMode(e.target.value as any)}>
              <option value="selected">فقط دانش‌آموزان انتخابی</option>
              <option value="all">برای همه دانش‌آموزان</option>
            </select>
          </label>
        </div>
      </Card>

      <Card hover={false}>
        <div className="font-bold">۱) آپلود فایل PDF آزمون</div>
        <div className="mt-2 text-sm text-muted">فایل PDF در زمان آزمون داخل سایت نمایش داده می‌شود و قابل دانلود است.</div>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <input
            type="file"
            className="input"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickPdf(f);
              e.target.value = "";
            }}
          />
          {pdfUrl ? (
            <div className="text-xs text-muted">آپلود شد: <a className="link" href={pdfUrl} target="_blank" rel="noreferrer">مشاهده</a></div>
          ) : (
            <div className="text-xs text-muted">هنوز آپلود نشده</div>
          )}
        </div>
        {pdfUrl ? <div className="mt-4"><PdfReader url={pdfUrl} /></div> : null}
      </Card>

      <Card hover={false}>
        <div className="font-bold">۲) آپلود اکسل پاسخنامه (فقط کلید گزینه‌ها)</div>
        <div className="mt-2 text-sm text-muted">
          اکسل می‌تواند دو حالت داشته باشد:
          <ul className="list-disc pr-5 mt-2 leading-7">
            <li>حالت ستونی: هر ردیف = شماره سوال + گزینه صحیح</li>
            <li>حالت ردیفی: ردیف اول = شماره سوال‌ها، ردیف دوم = گزینه‌های صحیح</li>
          </ul>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickKey(f);
            }}
          />
          <div className="text-xs text-muted">{Object.keys(answerKey).length ? `${Object.keys(answerKey).length.toLocaleString("fa-IR")} پاسخ استخراج شد` : "فایل انتخاب نشده"}</div>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.3)" }}>
            <div className="text-xs text-muted">تعداد سوالات</div>
            <div className="mt-2 text-2xl font-extrabold">{questionCount.toLocaleString("fa-IR")}</div>
          </div>
          <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.3)" }}>
            <div className="text-xs text-muted">تعداد پاسخ‌های استخراج‌شده</div>
            <div className="mt-2 text-2xl font-extrabold">{Object.keys(answerKey).length.toLocaleString("fa-IR")}</div>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="font-bold">۳) تعیین بازه‌های درسی برای تحلیل کارنامه</div>
        <div className="mt-2 text-sm text-muted">مثال: ۱ تا ۲۰ = جامعه، ۲۱ تا ۳۵ = ریاضی. می‌تونی هر تعداد ردیف اضافه کنی.</div>

        <div className="mt-4 space-y-2">
          {ranges.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className="input col-span-3" type="number" value={r.from} onChange={(e) => updateRange(i, { from: Number(e.target.value || 1) })} />
              <input className="input col-span-3" type="number" value={r.to} onChange={(e) => updateRange(i, { to: Number(e.target.value || 1) })} />
              <input className="input col-span-5" value={r.subject} onChange={(e) => updateRange(i, { subject: e.target.value })} placeholder="نام درس" />
              <button className="btn-ghost col-span-1" type="button" onClick={() => removeRange(i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button className="btn-ghost" type="button" onClick={addRange}>+ افزودن ردیف</button>
        </div>
      </Card>

      {assignMode === "selected" ? (
        <Card hover={false}>
          <div className="font-bold">۴) انتخاب دانش‌آموزان</div>
          <div className="mt-2 text-sm text-muted">آزمون فقط برای این دانش‌آموزها نمایش داده می‌شود.</div>

          <div className="mt-3">
            <input className="input" placeholder="جستجو نام/ایمیل…" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-2 max-h-72 overflow-auto">
            {filteredStudents.map((s) => {
              const checked = selectedStudents.includes(s.user_id);
              return (
                <button
                  key={s.user_id}
                  type="button"
                  className={`rounded-3xl border p-3 text-right transition ${checked ? "btn-primary" : "btn-ghost"}`}
                  style={!checked ? { borderColor: "rgb(var(--border))" } : undefined}
                  onClick={() => toggleStudent(s.user_id)}
                >
                  <div className="font-semibold">{s.name || s.email}</div>
                  <div className="text-xs text-muted mt-1" dir="ltr">{s.email}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-muted">انتخاب‌شده: {selectedStudents.length.toLocaleString("fa-IR")}</div>
        </Card>
      ) : null}

      <Card hover={false}>
        <button className="btn-primary w-full" disabled={busy} onClick={() => void createExam()}>
          {busy ? "در حال ثبت…" : "ساخت آزمون PDF"}
        </button>
        <button className="btn-ghost w-full mt-2" onClick={() => nav("/admin")}>بازگشت</button>
      </Card>
    </div>
  );
}
