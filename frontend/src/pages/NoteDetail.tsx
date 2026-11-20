import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "../components/Container";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PdfReader from "../components/PdfReader";
import type { Note } from "../lib/types";
import { getNote } from "../lib/db";
import { apiFetch, apiUrl } from "../lib/api";
import ImageCarousel from "../components/ImageCarousel";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { IconCart } from "../components/Icons";

export default function NoteDetail() {
  const { add } = useCart();
  const { push } = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileAccess, setFileAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setLoadError("");
      try {
        const result = await getNote(id);
        if (active) setNote(result);
      } catch (error: any) {
        if (active) {
          setNote(null);
          setLoadError(error?.message || "دریافت اطلاعات جزوه ناموفق بود.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      setFileAccess(false);
      if (!id || !note?.hasPdf || !user) {
        setAccessLoading(false);
        return;
      }
      setAccessLoading(true);
      try {
        const result = await apiFetch<{ available: boolean }>(`/notes/${id}/file/access`);
        if (active) setFileAccess(Boolean(result?.available));
      } catch {
        if (active) setFileAccess(false);
      } finally {
        if (active) setAccessLoading(false);
      }
    }
    void checkAccess();
    return () => { active = false; };
  }, [id, note?.hasPdf, user?.id]);

  if (!loading && !note) {
    return (
      <div className="py-12 page-enter">
        <Container>
          <Card hover={false}>
            <div className="font-bold">جزوه پیدا نشد</div>
            <div className="mt-3 text-sm text-muted">{loadError || "به فروشگاه برگردید و جزوه دیگری انتخاب کنید."}</div>
            <div className="mt-5"><Link className="btn-ghost" to="/shop">بازگشت به فروشگاه</Link></div>
          </Card>
        </Container>
      </div>
    );
  }

  if (loading || !note) {
    return <div className="py-12 page-enter"><Container><Card hover={false}><div className="text-sm text-muted">در حال بارگذاری…</div></Card></Container></div>;
  }

  const fileUrl = id ? `${apiUrl()}/notes/${id}/file` : "";

  return (
    <div className="py-10 page-enter">
      <Container>
        <div className="flex items-center justify-between gap-3">
          <Link to="/shop" className="btn-ghost">بازگشت به فروشگاه</Link>
          <Link to="/exams" className="btn-ghost hidden sm:inline-flex">آزمون آنلاین</Link>
        </div>

        <div className="mt-6 grid lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-4">
            <Card hover={false}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-4xl">{note.coverEmoji || "📘"}</div>
                <div className="chip">{note.price.toLocaleString("fa-IR")} تومان</div>
              </div>

              {note.imageUrls?.length ? <div className="mt-5"><ImageCarousel images={note.imageUrls} alt={note.title} /></div> : null}

              <h1 className="mt-5 text-2xl font-extrabold">{note.title}</h1>
              <p className="mt-4 text-sm text-muted leading-8">{note.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(note.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>

              <div className="mt-7 rounded-2xl border p-4 text-sm" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / .55)" }}>
                <div className="font-bold">مشخصات منبع</div>
                <ul className="mt-3 space-y-2 text-muted">
                  <li className="flex items-center justify-between gap-3"><span>فایل PDF</span><span>{note.hasPdf ? "موجود" : "ثبت نشده"}</span></li>
                  <li className="flex items-center justify-between gap-3"><span>تصاویر پیش‌نمایش</span><span>{(note.imageUrls || []).length.toLocaleString("fa-IR")}</span></li>
                  <li className="flex items-center justify-between gap-3"><span>دسترسی فایل</span><span>{fileAccess ? "فعال" : "پس از تأیید سفارش"}</span></li>
                </ul>
              </div>
            </Card>

            {note.hasPdf ? (
              <Card hover={false}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div><h2 className="font-extrabold">پیش‌نمایش فایل PDF</h2><p className="mt-1 text-xs text-muted">دسترسی به فایل برای خریداران پس از تأیید سفارش فعال می‌شود.</p></div>
                  {fileAccess ? <Badge variant="primary">دسترسی فعال</Badge> : <Badge>دسترسی محدود</Badge>}
                </div>
                {accessLoading ? <div className="mt-4 text-sm text-muted">در حال بررسی دسترسی…</div> : null}
                {!accessLoading && fileAccess ? <div className="mt-4"><PdfReader url={fileUrl} /></div> : null}
                {!accessLoading && !fileAccess && !user ? (
                  <div className="mt-4 rounded-2xl p-4" style={{ background: "rgb(var(--bg-2))" }}>
                    <p className="text-sm text-muted">برای مشاهده فایل، ابتدا وارد حساب دانش‌آموزی خود شوید.</p>
                    <Link to={`/login?next=/shop/${id}`} className="btn-primary mt-3">ورود به حساب</Link>
                  </div>
                ) : null}
                {!accessLoading && !fileAccess && user?.role === "student" ? (
                  <div className="mt-4 rounded-2xl p-4" style={{ background: "rgb(var(--accent-soft))" }}>
                    <p className="text-sm leading-7" style={{ color: "rgb(var(--accent-3))" }}>فایل PDF پس از ثبت سفارش و تأیید آن توسط مدیریت برای حساب شما فعال می‌شود.</p>
                    <Link to="/cart" className="btn-ghost mt-3">مشاهده سبد خرید</Link>
                  </div>
                ) : null}
                {!accessLoading && !fileAccess && user && user.role !== "student" && user.role !== "admin" ? (
                  <div className="mt-4 text-sm text-muted">دسترسی به فایل برای حساب دانش‌آموزی و مدیریت فعال است.</div>
                ) : null}
              </Card>
            ) : (
              <Card hover={false}><div className="text-sm text-muted">برای این جزوه هنوز فایل PDF بارگذاری نشده است.</div></Card>
            )}
          </div>

          <aside className="lg:col-span-4">
            <Card hover={false}>
              <div className="font-extrabold">خرید و دریافت جزوه</div>
              <p className="mt-2 text-sm text-muted leading-7">جزوه را به سبد اضافه کنید و سفارش خود را ثبت کنید. پس از تأیید سفارش توسط مدیریت، دسترسی فایل PDF در همین صفحه فعال می‌شود.</p>

              <button className="btn-primary w-full mt-5" onClick={() => { add(note); push({ type: "success", title: "به سبد اضافه شد", message: note.title }); }}>
                افزودن به سبد <IconCart className="h-4 w-4" />
              </button>
              <Link to="/cart" className="btn-ghost w-full mt-2">مشاهده سبد</Link>
              <div className="mt-4 text-xs text-muted leading-6">وضعیت سفارش و تأیید دسترسی از طریق پنل مدیریت انجام می‌شود.</div>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
