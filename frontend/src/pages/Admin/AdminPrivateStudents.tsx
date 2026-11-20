import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { useToast } from "../../context/ToastContext";
import { apiFetch } from "../../lib/api";

export default function AdminPrivateStudents() {
  const { push } = useToast();
  const nav = useNavigate();

  const [advisors, setAdvisors] = useState<any[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdvisorId, setOpenAdvisorId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState({ name: "", email: "", username: "", password: "", phone: "" });

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/private-advisors");
      setAdvisors(data.advisors ?? []);
      setUnassigned(data.unassigned ?? []);
      if (!openAdvisorId && data.advisors?.[0]?.user_id) setOpenAdvisorId(data.advisors[0].user_id);
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err.message || "خطا در دریافت اطلاعات" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createAdvisor() {
    if (!newAdvisor.name.trim() || !newAdvisor.email.trim() || !newAdvisor.password.trim()) {
      push({ type: "error", title: "اطلاعات ناقص", message: "نام، ایمیل و رمز عبور مشاور لازم است." });
      return;
    }
    setCreating(true);
    try {
      await apiFetch("/admin/advisors", { method: "POST", body: newAdvisor });
      setNewAdvisor({ name: "", email: "", username: "", password: "", phone: "" });
      push({ type: "success", title: "مشاور ساخته شد" });
      await load();
    } catch (err: any) {
      push({ type: "error", title: "خطا", message: err?.message || "ساخت مشاور ناموفق بود" });
    } finally {
      setCreating(false);
    }
  }

  const openAdvisor = advisors.find((a) => a.user_id === openAdvisorId);

  return (
    <div className="space-y-5">
      <Card hover={false} className="p-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <div className="text-xs text-muted">مدیریت</div>
            <h1 className="text-2xl font-extrabold mt-1">شاگردان خصوصی موسسه</h1>
            <p className="text-sm text-muted mt-2 leading-7">
              ابتدا مشاور را انتخاب کنید؛ سپس شاگردهای همان مشاور و تاریخ تمدیدشان نمایش داده می‌شود.
            </p>
          </div>
          <button className="btn-ghost" onClick={() => void load()} type="button">به‌روزرسانی</button>
        </div>
      </Card>

      <Card hover={false} className="p-6">
        <div className="text-lg font-black mb-4">افزودن مشاور</div>
        <div className="grid md:grid-cols-5 gap-3">
          <input className="input" placeholder="نام مشاور" value={newAdvisor.name} onChange={(e) => setNewAdvisor((p) => ({ ...p, name: e.target.value }))} />
          <input className="input" placeholder="ایمیل" dir="ltr" value={newAdvisor.email} onChange={(e) => setNewAdvisor((p) => ({ ...p, email: e.target.value }))} />
          <input className="input" placeholder="نام کاربری اختیاری" dir="ltr" value={newAdvisor.username} onChange={(e) => setNewAdvisor((p) => ({ ...p, username: e.target.value }))} />
          <input className="input" placeholder="رمز عبور" value={newAdvisor.password} onChange={(e) => setNewAdvisor((p) => ({ ...p, password: e.target.value }))} />
          <button className="btn-primary" disabled={creating} onClick={createAdvisor} type="button">{creating ? "..." : "ساخت مشاور"}</button>
        </div>
      </Card>

      {loading ? <Card hover={false}><div className="text-sm text-muted">در حال بارگذاری...</div></Card> : null}

      {!loading && advisors.length === 0 ? (
        <Card hover={false}><div className="text-sm text-muted">هنوز مشاوری ساخته نشده است.</div></Card>
      ) : null}

      {advisors.length > 0 ? (
        <div className="grid lg:grid-cols-12 gap-4">
          <Card hover={false} className="lg:col-span-4 p-4">
            <div className="text-sm font-black mb-3">مشاوران</div>
            <div className="space-y-2">
              {advisors.map((a) => (
                <button
                  key={a.user_id}
                  type="button"
                  onClick={() => setOpenAdvisorId(a.user_id)}
                  className={`w-full text-right rounded-2xl border p-4 transition ${openAdvisorId === a.user_id ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"}`}
                  style={{ borderColor: "rgb(var(--border))" }}
                >
                  <div className="font-black">{a.name}</div>
                  <div className="text-xs text-muted mt-1" dir="ltr">{a.email}</div>
                  <div className="mt-3"><Badge>{(a.students?.length || 0).toLocaleString("fa-IR")} شاگرد</Badge></div>
                </button>
              ))}
            </div>
          </Card>

          <Card hover={false} className="lg:col-span-8 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm text-muted">شاگردان مشاور</div>
                <h2 className="text-xl font-black mt-1">{openAdvisor?.name || "—"}</h2>
              </div>
            </div>

            {!openAdvisor?.students?.length ? (
              <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-sm text-muted" style={{ borderColor: "rgb(var(--border))" }}>
                برای این مشاور هنوز شاگردی تعریف نشده است.
              </div>
            ) : (
              <div className="mt-5 overflow-auto rounded-2xl border" style={{ borderColor: "rgb(var(--border))" }}>
                <table className="min-w-[760px] w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ background: "rgb(var(--bg-2) / 0.7)" }}>
                      <th className="p-3 text-right">شاگرد</th>
                      <th className="p-3 text-right">پایه</th>
                      <th className="p-3 text-right">شماره</th>
                      <th className="p-3 text-right">تاریخ تمدید</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openAdvisor.students.map((s: any) => (
                      <tr key={s.user_id} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
                        <td className="p-3">
                          <div className="font-semibold">{s.name || "بدون نام"}</div>
                          <div className="text-xs text-muted" dir="ltr">{s.email}</div>
                        </td>
                        <td className="p-3">{s.grade || "—"}</td>
                        <td className="p-3">{s.phone || "—"}</td>
                        <td className="p-3"><Badge variant="info">{s.private_renewal_date || "—"}</Badge></td>
                        <td className="p-3 text-left"><button className="btn-primary" onClick={() => nav(`/admin/private-students/${s.user_id}`)} type="button">برنامه</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {unassigned.length > 0 ? (
        <Card hover={false} className="p-5">
          <div className="text-lg font-black">شاگردان خصوصی بدون مشاور</div>
          <p className="text-sm text-muted mt-1">از صفحه «دانش‌آموزان» برای هرکدام مشاور و تاریخ تمدید انتخاب کنید.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {unassigned.map((s) => (
              <div key={s.user_id} className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))" }}>
                <div className="font-bold">{s.name || "بدون نام"}</div>
                <div className="text-xs text-muted mt-1" dir="ltr">{s.email}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
