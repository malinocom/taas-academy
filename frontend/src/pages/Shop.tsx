import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "../components/Container";
import Card from "../components/Card";
import Badge from "../components/Badge";
import type { Note } from "../lib/types";
import { listNotes } from "../lib/db";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { IconCart } from "../components/Icons";

export default function Shop() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listNotes();
        if (active) setNotes(rows);
      } catch (err: any) {
        if (active) setError(err?.message || "دریافت فهرست جزوه‌ها ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  const { add } = useCart();
  const { push } = useToast();

  return (
    <div className="py-10 page-enter">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-xs text-muted">فروشگاه</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">فروشگاه جزوه</h1>
            <p className="mt-2 text-sm text-muted leading-7">جزوه را انتخاب کنید، سفارش را ثبت کنید و پس از تأیید مدیریت به فایل PDF دسترسی داشته باشید.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/cart" className="btn-ghost">سبد خرید <IconCart className="h-4 w-4" /></Link>
            <Link to="/exams" className="btn-ghost">آزمون آنلاین</Link>
          </div>
        </div>

        {loading ? <Card hover={false} className="mt-7"><div className="text-sm text-muted">در حال دریافت جزوه‌ها…</div></Card> : null}
        {error ? <Card hover={false} className="mt-7"><div className="text-sm text-rose-600">{error}</div></Card> : null}
        {!loading && !error && notes.length === 0 ? <Card hover={false} className="mt-7"><div className="py-5 text-center text-sm text-muted">در حال حاضر جزوه‌ای برای نمایش ثبت نشده است.</div></Card> : null}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="p-0 overflow-hidden" hover={false}>
              {note.imageUrls?.[0] ? (
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={note.imageUrls[0]} alt={note.title} className="h-full w-full object-cover" loading="lazy" onError={(event) => { (event.currentTarget.parentElement as HTMLElement | null)?.remove(); }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 right-3 chip">{note.price.toLocaleString("fa-IR")} تومان</div>
                </div>
              ) : null}

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-3xl">{note.coverEmoji || "📘"}</div>
                  <div className="flex items-center gap-2">
                    {note.hasPdf ? <Badge variant="primary">PDF</Badge> : null}
                    {!note.imageUrls?.[0] ? <div className="chip">{note.price.toLocaleString("fa-IR")} تومان</div> : null}
                  </div>
                </div>
                <div className="mt-4 font-bold text-lg">{note.title}</div>
                <p className="mt-2 text-sm text-muted leading-7 max-h-20 overflow-hidden">{note.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(note.tags || []).slice(0, 3).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                </div>

                <div className="mt-5 flex items-center justify-between gap-2">
                  <Link to={`/shop/${note.id}`} className="btn-ghost">جزئیات</Link>
                  <button className="btn-primary" onClick={() => { add(note); push({ type: "success", title: "به سبد اضافه شد", message: note.title }); }}>افزودن به سبد</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
