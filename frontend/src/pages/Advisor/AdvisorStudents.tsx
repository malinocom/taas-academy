import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { apiFetch } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function AdvisorStudents() {
  const nav = useNavigate();
  const { push } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/advisor/private-students");
      setStudents(res?.students || []);
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "دریافت شاگردان ناموفق بود" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Card hover={false} className="p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">پنل مشاور</div>
          <h1 className="text-2xl font-extrabold mt-1">شاگردان خصوصی من</h1>
          <p className="text-sm text-muted mt-2">برای هر شاگرد می‌توانید برنامه بنویسید و تاریخ تمدید را ببینید.</p>
        </div>
        <button className="btn-ghost" onClick={() => void load()} type="button">به‌روزرسانی</button>
      </div>

      {loading ? <div className="mt-6 text-sm text-muted">در حال بارگذاری…</div> : null}
      {!loading && students.length === 0 ? <div className="mt-6 text-sm text-muted">شاگردی برای شما تعریف نشده است.</div> : null}

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {students.map((s) => (
          <div key={s.user_id} className="rounded-3xl border p-5" style={{ borderColor: "rgb(var(--border))" }}>
            <div className="font-black text-lg">{s.name || "بدون نام"}</div>
            <div className="text-xs text-muted mt-1" dir="ltr">{s.email}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>پایه: {s.grade || "—"}</Badge>
              <Badge>شماره: {s.phone || "—"}</Badge>
              <Badge variant="info">تمدید: {s.private_renewal_date || "—"}</Badge>
            </div>
            <button className="btn-primary mt-5 w-full" onClick={() => nav(`/advisor/private-students/${s.user_id}`)} type="button">
              نوشتن برنامه
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
