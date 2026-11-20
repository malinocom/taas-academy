import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrderDb } from "../lib/db";
import type { Major } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { IconCart, IconShieldLock, IconArrowLeft } from "../components/Icons";

const MAJORS: Major[] = ["عمومی", "ریاضی", "تجربی", "انسانی"];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const { push } = useToast();
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nationalId, setNationalId] = useState(user?.nationalId || "");
  const [email, setEmail] = useState(user?.email || "");
  const [grade, setGrade] = useState(user?.grade || "");
  const [major, setMajor] = useState<Major>((user?.major as Major) || "عمومی");
  const [address, setAddress] = useState(user?.address || "");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!phone.trim() || phone.replace(/\s/g, "").length < 10) return false;
    if (!nationalId.trim() || nationalId.replace(/\s/g, "").length !== 10) return false;
    if (!email.includes("@")) return false;
    if (items.length === 0) return false;
    if (!user || user.role !== "student") return false;
    return true;
  }, [name, phone, nationalId, email, items.length, user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || user.role !== "student") {
      push({ type: "error", title: "دسترسی", message: "ثبت سفارش فقط برای دانش‌آموز فعال است." });
      return;
    }
    if (items.length === 0) {
      push({ type: "info", title: "سبد خالی", message: "ابتدا جزوه‌ای به سبد اضافه کنید." });
      nav("/shop");
      return;
    }
    if (!canSubmit) {
      push({ type: "error", title: "اطلاعات ناقص", message: "اطلاعات را کامل و صحیح وارد کنید." });
      return;
    }

    setSubmitting(true);
    try {
      await createOrderDb({
        userId: user.id,
        items: items.map((x) => ({ noteId: x.noteId, title: x.title, price: x.price, qty: x.qty })),
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          email: email.trim(),
          grade: grade.trim() || undefined,
          major,
          address: address.trim() || undefined,
        },
      });
      clear();
      push({ type: "success", title: "سفارش ثبت شد", message: "سفارش شما ثبت شد و پس از بررسی ادمین به‌روزرسانی می‌شود." });
      nav("/student/orders", { replace: true });
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ثبت سفارش ناموفق بود." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-10 page-enter">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-xs text-muted">پرداخت / ثبت سفارش</div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <IconShieldLock size={20} /> تکمیل اطلاعات خرید
            </h2>
            <p className="mt-2 text-sm text-muted leading-7">
              اطلاعات خرید را تکمیل کن تا سفارش ثبت شود. وضعیت سفارش در پنل ادمین به‌روزرسانی خواهد شد.
            </p>
          </div>
          <Link to="/cart" className="btn-ghost hidden sm:inline-flex">
            بازگشت به سبد <IconArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid lg:grid-cols-12 gap-4">
          <section className="lg:col-span-7">
            <BookCard hover={false}>
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted">نام و نام خانوادگی</label>
                    <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted">شماره تماس</label>
                    <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912..." />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted">کد ملی</label>
                    <input className="input mt-1" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="۱۰ رقم" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">ایمیل</label>
                    <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted">پایه تحصیلی</label>
                    <input className="input mt-1" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="مثلاً دوازدهم / کنکور" />
                  </div>
                  <div>
                    <label className="text-xs text-muted">رشته</label>
                    <select className="input mt-1" value={major} onChange={(e) => setMajor(e.target.value as Major)}>
                      {MAJORS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted">آدرس (اختیاری)</label>
                  <textarea className="textarea mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <button className="btn-primary w-full" type="submit" disabled={!canSubmit || submitting}>
                  ثبت سفارش ({total.toLocaleString("fa-IR")} تومان)
                </button>
                <div className="text-xs text-muted leading-6">
                  <IconCart size={14} className="inline" /> اقلام سفارش در ستون سمت راست نمایش داده می‌شود.
                </div>
              </form>
            </BookCard>
          </section>

          <aside className="lg:col-span-5">
            <BookCard hover={false}>
              <div className="text-xs text-muted">اقلام سفارش</div>
              <div className="mt-3 space-y-3">
                {items.map((it) => (
                  <div key={it.noteId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{it.coverEmoji || "📘"}</div>
                      <div>
                        <div className="text-sm font-semibold">{it.title}</div>
                        <div className="text-xs text-muted">
                          {it.qty.toLocaleString("fa-IR")} × {it.price.toLocaleString("fa-IR")} تومان
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{(it.qty * it.price).toLocaleString("fa-IR")} تومان</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t" style={{ borderColor: "rgb(var(--border))" }} />
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted">مبلغ کل</div>
                <div className="text-lg font-extrabold">{total.toLocaleString("fa-IR")} تومان</div>
              </div>
            </BookCard>
          </aside>
        </div>
      </Container>
    </div>
  );
}
