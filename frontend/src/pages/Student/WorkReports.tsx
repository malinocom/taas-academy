import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Container from "../../components/Container";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { reportStatusLabel } from "../../lib/workReports";
import { BUCKETS, createWorkReportDb, listWorkReportsForUser, uploadMany } from "../../lib/db";
import { IconNotebook, IconPencil, IconShield } from "../../components/Icons";
import type { WorkReport } from "../../lib/types";
import ImageCarousel from "../../components/ImageCarousel";

export default function StudentWorkReports() {
  const { user } = useAuth();
  const { push } = useToast();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listWorkReportsForUser(user.id);
      setReports(rows);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت گزارش‌ها ناموفق بود." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const arr = Array.from(e.target.files ?? []);
    setFiles(arr);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!files.length) {
      push({ type: "error", title: "تصویر لازم است", message: "لطفاً حداقل یک تصویر از گزارش کار انتخاب کن." });
      return;
    }

    setBusy(true);
    try {
      const folder = `${user.id}/${Date.now()}`;   
      const uploaded = await uploadMany(BUCKETS.reportImages, files, folder);   
      const imageUrls = uploaded
        .map((u: any) => u?.publicUrl || u?.url)
        .filter(Boolean);
      
      await createWorkReportDb({
        userId: user.id,
        imageUrls,
        title: title.trim() || undefined,
        note: note.trim() || undefined
      });
      
      setTitle("");
      setNote("");
      setFiles([]);
    
      push({
        type: "success",
        title: "ارسال شد",
        message: "گزارش کار ثبت شد و بعد از بررسی ادمین نتیجه نمایش داده می‌شود."
      });
    
      await refresh();
    
    } catch (err: any) {
      push({
        type: "error",
        title: "خطا",
        message: err?.message ?? "ارسال گزارش ناموفق بود."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container>
      <Card hover={false}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted">گزارش کار</div>
            <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
              <IconNotebook size={20} /> آپلود گزارش کار
            </div>
            <div className="mt-2 text-sm text-muted leading-7">
              تصاویر گزارش کار را ارسال کن؛ ادمین می‌تواند تایید/رد کند و توضیح بنویسد.
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <IconShield size={16} /> ثبت و پیگیری داخل سیستم
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-12 gap-4">
          <section className="lg:col-span-6">
            <div className="glass rounded-3xl p-5">
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <label className="text-xs text-muted">عنوان (اختیاری)</label>
                  <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً تمرین فصل ۲" />
                </div>
                <div>
                  <label className="text-xs text-muted">توضیح (اختیاری)</label>
                  <textarea className="textarea mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="اگر نکته‌ای داری..." />
                </div>
                <div>
                  <label className="text-xs text-muted">تصاویر گزارش کار</label>
                  <input className="input mt-1" type="file" accept="image/*" multiple onChange={onPick} />
                  <div className="mt-2 text-xs text-muted">می‌تونی چند عکس انتخاب کنی. (JPG/PNG)</div>
                </div>
                <button className="btn-primary w-full" type="submit" disabled={busy}>
                  ارسال گزارش <IconPencil className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>

          <aside className="lg:col-span-6">
            <div className="text-sm font-semibold">گزارش‌های قبلی</div>

            {loading ? <div className="mt-3 text-sm text-muted">در حال بارگذاری…</div> : null}

            {!loading && reports.length === 0 ? (
              <div className="mt-3 rounded-3xl glass p-5">
                <div className="font-bold">هنوز گزارشی ثبت نشده</div>
                <div className="mt-2 text-sm text-muted">اولین گزارش را از فرم سمت راست ارسال کن.</div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-3xl glass p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{r.title || "بدون عنوان"}</div>
                        <div className="mt-1 text-xs text-muted">{new Date(r.createdAt).toLocaleString("fa-IR")}</div>
                      </div>
                      <span className="chip">{reportStatusLabel(r.status)}</span>
                    </div>
                    {r.note ? <div className="mt-3 text-sm text-muted leading-7">{r.note}</div> : null}

                    <div className="mt-3">
                      <ImageCarousel images={r.imageUrls ?? []} alt="work report" />
                    </div>

                    {r.adminComment ? (
                      <div
                        className="mt-4 rounded-2xl border p-3"
                        style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.6)" }}
                      >
                        <div className="text-xs text-muted">نظر ادمین</div>
                        <div className="mt-1 text-sm leading-7">{r.adminComment}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </Card>
    </Container>
  );
}
