import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../lib/format";
import { formatDateTime } from "../../lib/format";
import type { Exam } from "../../lib/types";
import { deleteExamDb, getExamRetakesDb, listExamsAll, updateExamDb, updateExamRetakeDb } from "../../lib/db";

export default function AdminExams() {
  const { push } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  const [retakeExamId, setRetakeExamId] = useState<string | null>(null);
  const [retakes, setRetakes] = useState<null | { examId: string; title: string; rows: { userId: string; name: string; email: string; allowedAttempts: number; usedAttempts: number; canAttempt: boolean }[] }>(null);
  const [retakeBusy, setRetakeBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listExamsAll();
      setExams(rows);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت آزمون‌ها ناموفق بود" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePublish(exam: Exam) {
    try {
      const updated = await updateExamDb(exam.id, { published: !exam.published });
      setExams((prev) => prev.map((x) => (x.id === exam.id ? updated : x)));
      push({ type: "success", title: "ثبت شد", message: updated.published ? "آزمون منتشر شد" : "آزمون غیرفعال شد" });
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "بروزرسانی ناموفق بود" });
    }
  }
  const [studentQuery, setStudentQuery] = useState("");
  const filteredRetakes = useMemo(() => {
    if (!retakes) return [];
    const q = studentQuery.trim().toLowerCase();
    if (!q) return retakes.rows;
    return retakes.rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }, [retakes, studentQuery]);
  

  async function removeExam(exam: Exam) {
    if (!confirm("حذف آزمون؟")) return;
    try {
      await deleteExamDb(exam.id);
      setExams((prev) => prev.filter((x) => x.id !== exam.id));
      push({ type: "success", title: "حذف شد", message: "آزمون حذف شد" });
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "حذف ناموفق بود" });
    }
  }

  async function openRetakes(examId: string) {
    setRetakeExamId(examId);
    setRetakes(null);
    try {
      const r = await getExamRetakesDb(examId);
      setRetakes(r);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت لیست مجدد ناموفق بود" });
    }
  }

  async function allowOneMore(userId: string) {
    if (!retakeExamId || !retakes) return;
    setRetakeBusy(true);
    try {
      const row = retakes.rows.find((x) => x.userId === userId);
      const nextAllowed = (row?.allowedAttempts ?? 1) + 1;
      await updateExamRetakeDb(retakeExamId, { userId, allowedAttempts: nextAllowed });
      const fresh = await getExamRetakesDb(retakeExamId);
      setRetakes(fresh);
      push({ type: "success", title: "ثبت شد", message: "مجدد فعال شد" });
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "عملیات ناموفق بود" });
    } finally {
      setRetakeBusy(false);
    }
  }

  const nowMs = Date.now();
  const rows = useMemo(() => exams, [exams]);

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-2xl font-extrabold">مدیریت آزمون‌ها</div>
            <div className="mt-2 text-sm text-muted leading-7">حذف، غیرفعال/فعال کردن آزمون و فعال کردن شرکت مجدد برای دانش‌آموزان.</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/exams/new" className="btn-primary">ساخت آزمون جدید</Link>
            <button className="btn-ghost" onClick={() => void refresh()} type="button">به‌روزرسانی</button>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        {loading ? (
          <div className="text-sm text-muted">در حال بارگذاری…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted">آزمونی وجود ندارد.</div>
        ) : (
          <div className="overflow-auto rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }}>
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                  <th className="p-3 text-right">عنوان</th>
                  <th className="p-3 text-right">حالت</th>
                  <th className="p-3 text-right">شروع</th>
                  <th className="p-3 text-right">پایان</th>
                  <th className="p-3 text-right">وضعیت</th>
                  <th className="p-3 text-right">ساخته‌شده</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const notStarted = e.startAt ? nowMs < new Date(e.startAt).getTime() : false;
                  const ended = e.endAt ? nowMs > new Date(e.endAt).getTime() : false;
                  return (
                    <tr key={e.id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                      <td className="p-3 font-semibold">{e.title}</td>
                      <td className="p-3">{e.mode === "pdf" ? "PDF" : "بانک سوال"}</td>
                      <td className="p-3 text-xs text-muted" dir="ltr">{e.startAt ? formatDateTime(e.startAt) : "-"}</td>
                      <td className="p-3 text-xs text-muted" dir="ltr">{e.endAt ? formatDateTime(e.endAt) : "-"}</td>
                      <td className="p-3">
                        <span className="chip">
                          {ended ? "تمام شده" : notStarted ? "در انتظار شروع" : e.published ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted">{formatDate(e.createdAt)}</td>
                      <td className="p-3 text-left whitespace-nowrap">
                        <button className="btn-ghost" type="button" onClick={() => void togglePublish(e)}>
                          {e.published ? "غیرفعال" : "فعال"}
                        </button>
                        <button className="btn-ghost" type="button" onClick={() => void openRetakes(e.id)}>
                          شرکت مجدد
                        </button>
                        <button className="btn-ghost" type="button" onClick={() => void removeExam(e)}>
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {retakeExamId ? (
        <Card hover={false}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-lg font-extrabold">شرکت مجدد</div>
              <div className="text-sm text-muted mt-1">{retakes ? retakes.title : "…"}</div>
            </div>
            <button className="btn-ghost" type="button" onClick={() => setRetakeExamId(null)}>
              بستن
            </button>
          </div>

          {!retakes ? (
            <div className="mt-4 text-sm text-muted">در حال بارگذاری…</div>
          ) : (
            <div className="mt-4 overflow-auto rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }}>
             
          <div className="mt-3">
            <input className="input" placeholder="جستجو نام/ایمیل…" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
          </div>
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                    <th className="p-3 text-right">دانش‌آموز</th>
                    <th className="p-3 text-right">ایمیل</th>
                    <th className="p-3 text-right">استفاده‌شده</th>
                    <th className="p-3 text-right">مجاز</th>
                    <th className="p-3 text-right">وضعیت</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                {filteredRetakes.map((r) => (
                    <tr key={r.userId} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                      <td className="p-3 font-semibold">{r.name || r.email}</td>
                      <td className="p-3 text-xs text-muted" dir="ltr">{r.email}</td>
                      <td className="p-3">{r.usedAttempts.toLocaleString("fa-IR")}</td>
                      <td className="p-3">{r.allowedAttempts.toLocaleString("fa-IR")}</td>
                      <td className="p-3"><span className="chip">{r.canAttempt ? "مجاز" : "غیرمجاز"}</span></td>
                      <td className="p-3 text-left">
                        <button className="btn-primary" disabled={retakeBusy} onClick={() => void allowOneMore(r.userId)} type="button">
                          +۱ بار دیگر
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
