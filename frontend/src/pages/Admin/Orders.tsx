import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { orderStatusLabel } from "../../lib/shop";
import type { Order, OrderStatus } from "../../lib/types";
import { listOrdersAll, updateOrderStatusDb } from "../../lib/db";
import { useToast } from "../../context/ToastContext";
import { IconCart } from "../../components/Icons";

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "sent", "delivered", "canceled"];

export default function AdminOrders() {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listOrdersAll();
      setOrders(rows);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت سفارش‌ها ناموفق بود." });
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
    return orders
      .filter((o) => {
        if (!query) return true;
        return [o.id, o.customer.name, o.customer.phone, o.customer.nationalId, o.customer.email].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [orders, q]);

  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted">فروشگاه</div>
          <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
            <IconCart size={20} /> سفارشات
          </div>
          <div className="mt-2 text-sm text-muted leading-7">مشاهده سفارش‌ها و تغییر وضعیت آن‌ها.</div>
        </div>
        <div className="w-full sm:w-72">
          <input className="input" placeholder="جستجو: کد سفارش/نام/تماس..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="mt-6 text-sm text-muted">در حال بارگذاری…</div> : null}

      <div className="mt-6 overflow-auto rounded-3xl border" style={{ borderColor: "rgb(var(--border))" }}>
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
              <th className="p-3 text-right">کد</th>
              <th className="p-3 text-right">دانش‌آموز</th>
              <th className="p-3 text-right">اقلام</th>
              <th className="p-3 text-right">مبلغ</th>
              <th className="p-3 text-right">تاریخ</th>
              <th className="p-3 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const items = o.items.reduce((s, i) => s + i.qty, 0);
              return (
                <tr key={o.id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                  <td className="p-3 font-semibold">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="p-3">
                    <div className="font-semibold">{o.customer.name}</div>
                    <div className="text-xs text-muted">{o.customer.phone} • {o.customer.email}</div>
                  </td>
                  <td className="p-3">{items.toLocaleString("fa-IR")} آیتم</td>
                  <td className="p-3 font-semibold">{o.total.toLocaleString("fa-IR")} تومان</td>
                  <td className="p-3 text-xs text-muted">{new Date(o.createdAt).toLocaleString("fa-IR")}</td>
                  <td className="p-3">
                    <select
                      className="input !py-2"
                      value={o.status}
                      onChange={async (e) => {
                        const next = e.target.value as OrderStatus;
                        try {
                          await updateOrderStatusDb(o.id, next);
                          push({ type: "success", title: "به‌روزرسانی شد", message: `وضعیت سفارش: ${orderStatusLabel(next)}` });
                          await refresh();
                        } catch (err: any) {
                          push({ type: "error", title: "خطا", message: err?.message ?? "به‌روزرسانی ناموفق بود." });
                        }
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
