import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { useToast } from "../../context/ToastContext";
import { ConsultationBooking, listBookingsAdminDb, updateBookingAdminDb } from "../../lib/db";

export default function AdminBookings() {
  const { push } = useToast();
  const [rows, setRows] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await listBookingsAdminDb();
      setRows(r);
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "دریافت اطلاعات ناموفق بود" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: "new" | "contacted" | "closed") {
    try {
      await updateBookingAdminDb(id, { status });
      setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ثبت تغییرات ناموفق بود" });
    }
  }

  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, closed: 0 } as any;
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-xl font-extrabold">رزرو مشاوره</div>
            <div className="mt-2 text-sm text-muted">درخواست‌های ثبت‌شده در صفحه اصلی</div>
          </div>
          <button className="btn-ghost" onClick={() => void refresh()} type="button">به‌روزرسانی</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip">جدید: {counts.new.toLocaleString("fa-IR")}</span>
          <span className="chip">تماس گرفته‌شده: {counts.contacted.toLocaleString("fa-IR")}</span>
          <span className="chip">بسته: {counts.closed.toLocaleString("fa-IR")}</span>
        </div>

        {loading ? <div className="mt-5 text-sm text-muted">در حال بارگذاری…</div> : null}

        <div className="mt-5 overflow-auto rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }}>
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                <th className="p-3 text-right">تاریخ</th>
                <th className="p-3 text-right">نام</th>
                <th className="p-3 text-right">پایه</th>
                <th className="p-3 text-right">رشته</th>
                <th className="p-3 text-right">هدف</th>
                <th className="p-3 text-right">مشاور قبلی</th>
                <th className="p-3 text-right">تلفن</th>
                <th className="p-3 text-right">والد</th>
                <th className="p-3 text-right">مشاور انتخابی</th>
                <th className="p-3 text-right">دلیل کنسلی</th>
                <th className="p-3 text-right">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                  <td className="p-3 text-xs text-muted" dir="ltr">{(r.createdAt || "").slice(0, 16).replace("T", " ")}</td>
                  <td className="p-3 font-semibold">{r.fullName}</td>
                  <td className="p-3">{r.grade}</td>
                  <td className="p-3">{r.major}</td>
                  <td className="p-3">{r.goal}</td>
                  <td className="p-3">{r.hadAdvisorBefore ? "بله" : "خیر"}</td>
                  <td className="p-3" dir="ltr">{r.phone}</td>
                  <td className="p-3" dir="ltr">{r.parentPhone || "-"}</td>
                  <td className="p-3">{r.advisorChoice}</td>
                  <td className="p-3">{r.cancelReason || "-"}</td>
                  <td className="p-3">
                    <select className="input" value={r.status} onChange={(e) => void setStatus(r.id, e.target.value as any)}>
                      <option value="new">جدید</option>
                      <option value="contacted">تماس گرفته‌شده</option>
                      <option value="closed">بسته</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
