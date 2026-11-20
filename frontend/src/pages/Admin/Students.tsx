// src/pages/Admin/Students.tsx

import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { IconUser, IconChart } from "../../components/Icons";
import {
  listAttemptsAll,
  listOrdersAll,
  listStudents,
  listWorkReportsAll,
} from "../../lib/db";
import type { Attempt, Order, WorkReport } from "../../lib/types";
import type { Profile } from "../../lib/db";
import { useToast } from "../../context/ToastContext";
import { formatPercentFa } from "../../lib/percent";
import { apiFetch } from "../../lib/api";
export default function AdminStudents() {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Profile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const [s, a, o, r] = await Promise.all([
        listStudents(),
        listAttemptsAll(),
        listOrdersAll(),
        listWorkReportsAll(),
      ]);
      setStudents(s);
      setAttempts(a);
      setOrders(o);
      setReports(r);
      const advisorRes = await apiFetch("/admin/advisors");
      setAdvisors(advisorRes?.advisors || []);
    } catch (e: any) {
      push({
        type: "error",
        title: "خطا",
        message: e?.message ?? "دریافت اطلاعات ناموفق بود.",
      });
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
    const filtered = !query
      ? students
      : students.filter((u) =>
          [u.name, u.email, u.phone ?? "", u.national_id ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
        );

    return filtered
      .map((u) => {
        const a = attempts.filter((x) => x.userId === u.user_id);
        const o = orders.filter((x) => x.userId === u.user_id);
        const r = reports.filter((x) => x.userId === u.user_id);
        const avgPct = a.length
          ? a.reduce(
              (s2, x) =>
                s2 + (x.total ? (x.netCorrect / x.total) * 100 : 0),
              0
            ) / a.length
          : 0;
        return {
          u,
          attempts: a.length,
          orders: o.length,
          reports: r.length,
          avgPct,
        };
      })
      .sort((a, b) => (a.u.created_at < b.u.created_at ? 1 : -1));
  }, [q, students, attempts, orders, reports]);

  async function togglePrivate(userId: string, current: boolean | undefined) {
    const newVal = !current;
  
    try {
      await apiFetch(`/admin/students/${userId}/private`, {
        method: "POST",
        body: { isPrivateStudent: newVal },
      });
  
      setStudents((prev) =>
        prev.map((s) =>
          s.user_id === userId ? { ...s, is_private_student: newVal } : s
        )
      );
  
      push({
        type: "success",
        title: "انجام شد",
        message: newVal
          ? "دانش‌آموز به لیست خصوصی موسسه اضافه شد."
          : "دانش‌آموز از لیست خصوصی موسسه حذف شد.",
      });
    } catch (e: any) {
      push({
        type: "error",
        title: "خطا",
        message: e?.message ?? "عملیات ناموفق بود.",
      });
    }
  }

  async function updatePrivateAssignment(userId: string, patch: { advisorId?: string | null; privateRenewalDate?: string | null }) {
    try {
      const updated = await apiFetch(`/admin/students/${userId}/private-assignment`, {
        method: "PATCH",
        body: patch,
      });
      setStudents((prev) => prev.map((s) => s.user_id === userId ? { ...s, ...updated } : s));
      push({ type: "success", title: "ثبت شد", message: "اطلاعات خصوصی دانش‌آموز بروزرسانی شد." });
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ثبت اطلاعات ناموفق بود." });
    }
  }

  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted">مدیریت کاربران</div>
          <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
            <IconUser size={20} /> لیست دانش‌آموزان
          </div>
          <div className="mt-2 text-sm text-muted leading-7">
            مشاهده اطلاعات ثبت‌نام، سفارش‌ها، آزمون‌ها و گزارش‌های کار.
          </div>
        </div>
        <div className="w-full sm:w-72">
          <input
            className="input"
            placeholder="جستجو: نام، ایمیل، تماس..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted">در حال بارگذاری…</div>
      ) : null}

      <div
        className="mt-6 overflow-auto rounded-3xl border"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        <table className="min-w-[1280px] w-full text-sm">
          <thead>
            <tr
              className="text-xs"
              style={{ background: "rgb(var(--bg-2) / 0.6)" }}
            >
              <th className="p-3 text-right">دانش‌آموز</th>
              <th className="p-3 text-right">پایه / رشته</th>
              <th className="p-3 text-right">کد ملی</th>
              <th className="p-3 text-right">تماس</th>
              <th className="p-3 text-right">آزمون‌ها</th>
              <th className="p-3 text-right">سفارش‌ها</th>
              <th className="p-3 text-right">گزارش کار</th>
              <th className="p-3 text-right">میانگین</th>
              <th className="p-3 text-right">خصوصی موسسه</th>
              <th className="p-3 text-right">مشاور</th>
              <th className="p-3 text-right">تاریخ تمدید</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, attempts: ac, avgPct, orders: oc, reports: rc }) => (
              <tr
                key={u.user_id}
                className="border-t"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        {u.name}
                        {u.is_private_student ? (
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{
                              background: "gold",
                              boxShadow: "0 0 4px rgba(255,215,0,0.9)",
                            }}
                            title="دانش‌آموز خصوصی موسسه"
                          />
                        ) : null}
                      </div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>{u.grade || "—"}</div>
                  <div className="text-xs text-muted">{u.major || "—"}</div>
                </td>
                <td className="p-3">{u.national_id || "—"}</td>
                <td className="p-3">{u.phone || "—"}</td>
                <td className="p-3">{ac.toLocaleString("fa-IR")}</td>
                <td className="p-3">{oc.toLocaleString("fa-IR")}</td>
                <td className="p-3">{rc.toLocaleString("fa-IR")}</td>
                <td className="p-3">
                  <span className="chip inline-flex items-center gap-2">
                    <IconChart size={16} /> {formatPercentFa(avgPct)}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      borderColor: "rgb(var(--border))",
                      background: u.is_private_student
                        ? "rgba(234,179,8,0.1)"
                        : "transparent",
                      color: u.is_private_student ? "#d97706" : "inherit",
                    }}
                    onClick={() =>
                      togglePrivate(u.user_id, u.is_private_student)
                    }
                  >
                    {u.is_private_student
                      ? "حذف از خصوصی"
                      : "افزودن به خصوصی"}
                  </button>
                </td>
                <td className="p-3 min-w-[180px]">
                  <select
                    className="input text-xs"
                    disabled={!u.is_private_student}
                    value={u.private_advisor_id || ""}
                    onChange={(e) => void updatePrivateAssignment(u.user_id, { advisorId: e.target.value || null, privateRenewalDate: u.private_renewal_date || null })}
                  >
                    <option value="">بدون مشاور</option>
                    {advisors.map((a) => (
                      <option key={a.user_id} value={a.user_id}>{a.name}</option>
                    ))}
                  </select>
                  {u.private_advisor_name ? <div className="text-[11px] text-muted mt-1">فعلی: {u.private_advisor_name}</div> : null}
                </td>
                <td className="p-3 min-w-[160px]">
                  <input
                    className="input text-xs"
                    type="date"
                    disabled={!u.is_private_student}
                    value={u.private_renewal_date || ""}
                    onChange={(e) => void updatePrivateAssignment(u.user_id, { advisorId: u.private_advisor_id || null, privateRenewalDate: e.target.value || null })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
