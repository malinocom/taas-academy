import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { listStudents, listWorkReportsAll, reviewWorkReportDb } from "../../lib/db";
import { reportStatusLabel } from "../../lib/workReports";
import type { WorkReport, WorkReportStatus } from "../../lib/types";
import { useToast } from "../../context/ToastContext";
import { IconNotebook, IconPencil } from "../../components/Icons";
import ImageCarousel from "../../components/ImageCarousel";
import type { Profile } from "../../lib/db";

const STATUSES: WorkReportStatus[] = ["submitted", "approved", "rejected"]; 

export default function AdminWorkReports() {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([listWorkReportsAll(), listStudents()]);
      setReports(r);
      setStudents(s);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت گزارش‌ها ناموفق بود." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return reports
      .filter((r) => {
        if (!query) return true;
        const u = students.find((x) => x.user_id === r.userId);
        return [r.id, r.title || "", u?.name || "", u?.email || ""].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [reports, q, students]);

  const current = selected ? reports.find((r) => r.id === selected) || null : null;
  const currentUser = current ? students.find((u) => u.user_id === current.userId) : null;

  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted">گزارش کار</div>
          <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
            <IconNotebook size={20} /> مدیریت گزارش‌های کار
          </div>
          <div className="mt-2 text-sm text-muted leading-7">مشاهده، تایید/رد و نوشتن نظر برای دانش‌آموز.</div>
        </div>
        <div className="w-full sm:w-72">
          <input className="input" placeholder="جستجو: نام/ایمیل/عنوان..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="mt-6 text-sm text-muted">در حال بارگذاری…</div> : null}

      <div className="mt-6 grid lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7">
          <div className="overflow-auto rounded-3xl border" style={{ borderColor: "rgb(var(--border))" }}>
            <table className="min-w-[740px] w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                  <th className="p-3 text-right">دانش‌آموز</th>
                  <th className="p-3 text-right">عنوان</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const u = students.find((x) => x.user_id === r.userId);
                  const active = selected === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={["border-t cursor-pointer", active ? "" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"].join(" ")}
                      style={{
                        borderColor: "rgb(var(--border))",
                        background: active ? "rgb(var(--bg-2) / 0.7)" : undefined,
                      }}
                      onClick={() => {
                        setSelected(r.id);
                        setComment(r.adminComment || "");
                      }}
                    >
                      <td className="p-3">
                        <div className="font-semibold">{u?.name || "—"}</div>
                        <div className="text-xs text-muted">{u?.email || ""}</div>
                      </td>
                      <td className="p-3">{r.title || "—"}</td>
                      <td className="p-3 text-xs text-muted">{new Date(r.createdAt).toLocaleString("fa-IR")}</td>
                      <td className="p-3">
                        <span className="chip">{reportStatusLabel(r.status)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="lg:col-span-5">
          {!current ? (
            <div className="rounded-3xl glass p-5">
              <div className="font-bold">یک گزارش را انتخاب کن</div>
              <div className="mt-2 text-sm text-muted">از لیست سمت راست، روی یک ردیف کلیک کن.</div>
            </div>
          ) : (
            <div className="rounded-3xl glass p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{current.title || "گزارش کار"}</div>
                  <div className="mt-1 text-xs text-muted">
                    {currentUser?.name || "—"} • {new Date(current.createdAt).toLocaleString("fa-IR")}
                  </div>
                </div>
                <span className="chip">{reportStatusLabel(current.status)}</span>
              </div>

              {current.note ? <div className="mt-3 text-sm text-muted leading-7">{current.note}</div> : null}

              <div className="mt-4">
                <ImageCarousel images={current.imageUrls ?? []} alt="report" />
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted">نظر ادمین (برای نمایش به دانش‌آموز)</label>
                <textarea className="textarea mt-1" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={s === "approved" ? "btn-primary" : "btn-ghost"}
                    onClick={async () => {
                      try {
                        await reviewWorkReportDb(current.id, s, comment.trim() || undefined);
                        push({ type: "success", title: "ذخیره شد", message: `وضعیت: ${reportStatusLabel(s)}` });
                        await refresh();
                      } catch (err: any) {
                        push({ type: "error", title: "خطا", message: err?.message ?? "ذخیره ناموفق بود" });
                      }
                    }}
                  >
                    {s === "submitted" ? "در انتظار" : s === "approved" ? "تأیید" : "رد"}
                    <IconPencil className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-xs text-muted leading-6">* بعد از ذخیره، نظر ادمین در پنل دانش‌آموز نمایش داده می‌شود.</div>
            </div>
          )}
        </aside>
      </div>
    </Card>
  );
}
