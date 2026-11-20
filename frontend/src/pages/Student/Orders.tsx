import { useEffect, useMemo, useState } from "react";
import Container from "../../components/Container";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { orderStatusLabel } from "../../lib/shop";
import type { Order } from "../../lib/types";
import { Link } from "react-router-dom";
import { IconCart } from "../../components/Icons";
import { listOrdersForUser } from "../../lib/db";
import { useToast } from "../../context/ToastContext";

function itemLine(order: Order) {
  const count = order.items.reduce((s, i) => s + i.qty, 0);
  return `${count.toLocaleString("fa-IR")} آیتم`;
}

export default function StudentOrders() {
  const { user } = useAuth();
  const { push } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listOrdersForUser(user.id);
      setOrders(rows);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت سفارش‌ها ناموفق بود." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sorted = useMemo(() => orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [orders]);

  return (
    <Container>
      <Card hover={false}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted">سفارش‌ها</div>
            <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
              <IconCart size={20} /> سفارش‌های من
            </div>
            <div className="mt-2 text-sm text-muted leading-7">وضعیت سفارش‌ها و جزئیات اقلام.</div>
          </div>
          <Link to="/shop" className="btn-primary hidden sm:inline-flex">
            خرید جزوه
          </Link>
        </div>

        {loading ? <div className="mt-6 text-sm text-muted">در حال بارگذاری…</div> : null}

        {!loading && sorted.length === 0 ? (
          <div className="mt-6 rounded-3xl glass p-5">
            <div className="font-bold">هنوز سفارشی ثبت نکردی</div>
            <div className="mt-2 text-sm text-muted">از فروشگاه، جزوه انتخاب کن و سفارش ثبت کن.</div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {sorted.map((o) => (
              <div key={o.id} className="rounded-3xl glass p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">#{o.id.slice(-6).toUpperCase()}</div>
                    <div className="mt-1 text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString("fa-IR")} • {itemLine(o)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="chip">{orderStatusLabel(o.status)}</span>
                    <span className="chip">{o.total.toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {o.items.map((it) => (
                    <div
                      key={it.noteId}
                      className="rounded-2xl border p-3"
                      style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg-2) / 0.6)" }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📘</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{it.title}</div>
                          <div className="mt-1 text-xs text-muted">
                            {it.qty.toLocaleString("fa-IR")} × {it.price.toLocaleString("fa-IR")} تومان
                          </div>
                          <Link to={`/shop/${it.noteId}`} className="link mt-2 inline-block text-xs">مشاهده جزوه و دریافت فایل</Link>
                        </div>
                        <div className="text-sm font-semibold">{(it.qty * it.price).toLocaleString("fa-IR")} تومان</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
