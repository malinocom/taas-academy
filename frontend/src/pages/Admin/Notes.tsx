import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Card from "../../components/Card";
import { BUCKETS, createNote, deleteNote, listNotes, updateNote, uploadMany, uploadSingleDb } from "../../lib/db";
import type { Note } from "../../lib/types";
import { useToast } from "../../context/ToastContext";
import { IconNotebook, IconPencil, IconTrash, IconPlus } from "../../components/Icons";
import ImageCarousel from "../../components/ImageCarousel";
import PdfReader from "../../components/PdfReader";
import { apiUrl } from "../../lib/api";

function parseTags(s: string) {
  return s
    .split(/[,،]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminNotes() {
  const { push } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [removePdf, setRemovePdf] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listNotes();
      setNotes(rows);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت جزوه‌ها ناموفق بود." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = !query ? notes : notes.filter((n) => [n.title, n.description, ...(n.tags ?? [])].join(" ").toLowerCase().includes(query));
    return filtered;
  }, [q, notes]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setPrice(0);
    setDescription("");
    setTags("");
    setCoverEmoji("");
    setFiles([]);
    setPdfFile(null);
    setPdfUrl("");
    setPdfFileName("");
    setRemovePdf(false);
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setTitle(n.title);
    setPrice(n.price);
    setDescription(n.description);
    setTags((n.tags ?? []).join("، "));
    setCoverEmoji(n.coverEmoji ?? "");
    setFiles([]);
    setPdfFile(null);
    setPdfUrl(n.pdfUrl ?? "");
    setPdfFileName(n.pdfFileName ?? "");
    setRemovePdf(false);
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  function onPickPdf(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 25 * 1024 * 1024) {
      push({ type: "error", title: "حجم فایل زیاد است", message: "حداکثر حجم PDF برابر ۲۵ مگابایت است." });
      e.target.value = "";
      return;
    }
    if (file && file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      push({ type: "error", title: "فایل نامعتبر", message: "فقط فایل PDF انتخاب کنید." });
      e.target.value = "";
      return;
    }
    setPdfFile(file);
    setRemovePdf(false);
    e.target.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || price < 0 || !Number.isInteger(price)) {
      push({ type: "error", title: "اطلاعات ناقص", message: "عنوان، توضیحات و قیمت معتبر را وارد کنید." });
      return;
    }
    setBusy(true);
    try {
      let imageUrls: string[] | undefined = undefined;
      if (files.length) {
        const uploaded = await uploadMany(BUCKETS.notesImages, files, `notes/${Date.now()}`);
        imageUrls = uploaded.map((f) => f.url);
      }

      let nextPdfUrl: string | null = removePdf ? null : (pdfUrl || null);
      let nextPdfFileName: string | null = removePdf ? null : (pdfFileName || null);
      if (pdfFile) {
        const uploadedPdf = await uploadSingleDb(pdfFile, "note-files");
        nextPdfUrl = uploadedPdf.url;
        nextPdfFileName = pdfFile.name;
      }

      if (!editingId) {
        await createNote({
          title: title.trim(),
          price,
          description: description.trim(),
          tags: parseTags(tags),
          coverEmoji: coverEmoji.trim() || undefined,
          imageUrls,
          pdfUrl: nextPdfUrl,
          pdfFileName: nextPdfFileName,
        });
        push({ type: "success", title: "ثبت شد", message: "جزوه جدید اضافه شد." });
      } else {
        await updateNote(editingId, {
          title: title.trim(),
          price,
          description: description.trim(),
          tags: parseTags(tags),
          coverEmoji: coverEmoji.trim() || undefined,
          ...(imageUrls ? { imageUrls } : {}),
          pdfUrl: nextPdfUrl,
          pdfFileName: nextPdfFileName,
        });
        push({ type: "success", title: "به‌روزرسانی شد", message: "جزوه ویرایش شد." });
      }

      resetForm();
      await refresh();
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message ?? "عملیات ناموفق بود" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted">فروشگاه</div>
          <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
            <IconNotebook size={20} /> مدیریت جزوه‌ها
          </div>
          <div className="mt-2 text-sm text-muted leading-7">افزودن جزوه، فایل PDF و تصاویر پیش‌نمایش.</div>
        </div>
        <div className="w-full sm:w-72">
          <input className="input" placeholder="جستجو..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7">
          <div className="overflow-auto rounded-3xl border" style={{ borderColor: "rgb(var(--border))" }}>
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                  <th className="p-3 text-right">عنوان</th>
                  <th className="p-3 text-right">قیمت</th>
                  <th className="p-3 text-right">برچسب‌ها</th>
                  <th className="p-3 text-right">فایل PDF</th>
                  <th className="p-3 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                    <td className="p-3">
                      <div className="font-semibold flex items-center gap-2">
                        <span className="text-xl">{n.coverEmoji || "📘"}</span>
                        {n.title}
                      </div>
                      <div className="mt-1 text-xs text-muted line-clamp-1">{n.description}</div>
                    </td>
                    <td className="p-3 font-semibold">{n.price.toLocaleString("fa-IR")} تومان</td>
                    <td className="p-3 text-xs text-muted">{(n.tags ?? []).slice(0, 3).join("، ") || "—"}</td>
                    <td className="p-3 text-xs">{n.hasPdf || n.pdfUrl ? <span className="text-emerald-600">بارگذاری شده</span> : <span className="text-muted">ثبت نشده</span>}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost" onClick={() => startEdit(n)}>
                          ویرایش <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={async () => {
                            if (!confirm("حذف جزوه؟")) return;
                            try {
                              await deleteNote(n.id);
                              push({ type: "success", title: "حذف شد", message: "جزوه حذف شد." });
                              await refresh();
                            } catch (e: any) {
                              push({ type: "error", title: "خطا", message: e?.message ?? "حذف ناموفق بود" });
                            }
                          }}
                        >
                          حذف <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading ? <div className="mt-3 text-sm text-muted">در حال بارگذاری…</div> : null}
        </section>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl glass p-5">
            <div className="font-bold">{editingId ? "ویرایش جزوه" : "افزودن جزوه"}</div>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <div>
                <label className="text-xs text-muted">عنوان</label>
                <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">قیمت (تومان)</label>
                  <input className="input mt-1" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted">ایموجی کاور (اختیاری)</label>
                  <input className="input mt-1" value={coverEmoji} onChange={(e) => setCoverEmoji(e.target.value)} placeholder="📘" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted">توضیحات</label>
                <textarea className="textarea mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted">برچسب‌ها (با ویرگول جدا کن)</label>
                <input className="input mt-1" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="کنکور، نکته، تست" />
              </div>
              <div>
                <label className="text-xs text-muted">فایل PDF جزوه (حداکثر ۲۵ مگابایت)</label>
                <input className="input mt-1" type="file" accept="application/pdf,.pdf" onChange={onPickPdf} />
                {pdfFile ? <div className="mt-2 text-xs text-muted">فایل جدید: {pdfFile.name}</div> : null}
                {!pdfFile && pdfFileName && !removePdf ? <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="text-emerald-600">فایل فعلی: {pdfFileName}</span><button type="button" className="link text-rose-600" onClick={() => setRemovePdf(true)}>حذف فایل PDF</button></div> : null}
                {removePdf ? <div className="mt-2 text-xs text-rose-600">فایل PDF پس از ذخیره حذف خواهد شد.</div> : null}
                {pdfUrl && editingId && !removePdf ? <div className="mt-3"><PdfReader url={`${apiUrl()}/notes/${editingId}/file`} /></div> : null}
              </div>
              <div>
                <label className="text-xs text-muted">تصاویر پیش‌نمایش جزوه (اختیاری، چندعکسی)</label>
                <input className="input mt-1" type="file" accept="image/*" multiple onChange={onPick} />
                <div className="mt-2 text-xs text-muted flex items-center gap-2">
                  <IconPlus size={14} /> اگر تصویر جدید انتخاب کنی، تصاویر قبلی جایگزین می‌شوند.
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-primary flex-1" disabled={busy} type="submit">
                  {editingId ? "ذخیره تغییرات" : "افزودن"} <IconPencil className="h-4 w-4" />
                </button>
                {editingId ? (
                  <button type="button" className="btn-ghost" onClick={resetForm}>
                    انصراف
                  </button>
                ) : null}
              </div>
            </form>

            {editingId ? (
              <div className="mt-6">
                <div className="text-xs text-muted">پیش‌نمایش تصاویر فعلی</div>
                <div className="mt-2">
                  <ImageCarousel images={notes.find((x) => x.id === editingId)?.imageUrls ?? []} />
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </Card>
  );
}
