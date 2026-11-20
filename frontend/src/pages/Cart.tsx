import { Link, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { IconCart, IconTrash, IconPlus, IconMinus, IconArrowLeft } from "../components/Icons";

export default function CartPage() {
  const { items, total, count, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  return (
    <div className="py-10 page-enter">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-xs text-muted">فروشگاه</div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <IconCart size={20} /> سبد خرید
            </h2>
            <p className="mt-2 text-sm text-muted leading-7">جزوه‌های انتخاب‌شده را مدیریت کن و سفارش ثبت کن.</p>
          </div>
          <Link to="/shop" className="btn-ghost hidden sm:inline-flex">
            ادامه خرید <IconArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-6">
            <BookCard hover={false}>
              <div className="text-lg font-bold">سبد خرید خالی است</div>
              <p className="mt-2 text-sm text-muted leading-7">برای اضافه کردن جزوه، به فروشگاه برگرد.</p>
              <div className="mt-5">
                <Link to="/shop" className="btn-primary">
                  رفتن به فروشگاه
                </Link>
              </div>
            </BookCard>
          </div>
        ) : (
          <div className="mt-6 grid lg:grid-cols-12 gap-4">
            <section className="lg:col-span-8 space-y-3">
              {items.map((it) => (
                <BookCard key={it.noteId} hover={false} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{it.coverEmoji || "📘"}</div>
                    <div className="flex-1">
                      <div className="font-bold">{it.title}</div>
                      <div className="mt-1 text-sm text-muted">{it.price.toLocaleString("fa-IR")} تومان</div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-ghost px-3 py-2"
                            onClick={() => setQty(it.noteId, Math.max(1, it.qty - 1))}
                            aria-label="کم کردن"
                          >
                            <IconMinus size={18} />
                          </button>
                          <div className="chip min-w-[56px] justify-center">{it.qty.toLocaleString("fa-IR")}</div>
                          <button
                            className="btn-ghost px-3 py-2"
                            onClick={() => setQty(it.noteId, it.qty + 1)}
                            aria-label="زیاد کردن"
                          >
                            <IconPlus size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">
                            {(it.price * it.qty).toLocaleString("fa-IR")} تومان
                          </div>
                          <button className="btn-ghost px-3 py-2" onClick={() => remove(it.noteId)} aria-label="حذف">
                            <IconTrash size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </BookCard>
              ))}
            </section>

            <aside className="lg:col-span-4">
              <BookCard hover={false}>
                <div className="text-xs text-muted">خلاصه</div>
                <div className="mt-2 text-2xl font-extrabold">{total.toLocaleString("fa-IR")} تومان</div>
                <div className="mt-2 text-sm text-muted">
                  {count.toLocaleString("fa-IR")} آیتم در سبد
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    className="btn-primary w-full"
                    onClick={() => {
                      if (!user) {
                        push({ type: "info", title: "ورود لازم است", message: "برای ثبت سفارش، ابتدا وارد شوید." });
                        nav("/login?next=/checkout");
                        return;
                      }
                      if (user.role !== "student") {
                        push({ type: "error", title: "دسترسی", message: "ثبت سفارش فقط برای دانش‌آموز فعال است." });
                        return;
                      }
                      nav("/checkout");
                    }}
                  >
                    ادامه و ثبت سفارش
                  </button>
                  <button
                    className="btn-ghost w-full"
                    onClick={() => {
                      clear();
                      push({ type: "success", title: "انجام شد", message: "سبد خرید خالی شد." });
                    }}
                  >
                    پاک کردن سبد
                  </button>
                </div>

                <div className="mt-5 text-xs text-muted leading-6">
                  * پس از ثبت سفارش، وضعیت آن توسط ادمین به‌روزرسانی می‌شود و هماهنگی‌های لازم انجام خواهد شد.
                </div>
              </BookCard>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
}
