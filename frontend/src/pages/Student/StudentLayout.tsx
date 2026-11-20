import { NavLink, Outlet } from "react-router-dom";
import Container from "../../components/Container";
import Card from "../../components/Card";

function SideLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/student"}
      className={({ isActive }) =>
        [
          "block px-3 py-2.5 rounded-xl text-sm transition border border-transparent",
          isActive
            ? "bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-3))] border-[rgb(var(--accent-2)/.2)]"
            : "text-slate-700 dark:text-[rgb(var(--text))]/80 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function StudentLayout() {
  return (
    <div className="py-10 page-enter">
      <Container>
        <div className="grid lg:grid-cols-12 gap-4 items-start min-w-0">
          <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
            <Card>
              <div className="font-bold">پنل دانش‌آموز</div>
              <div className="mt-2 text-sm text-muted leading-7">
                نتایج، تحلیل و مسیر پیشنهادی.
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                <SideLink to="/student" label="داشبورد" />
                <SideLink to="/student/results" label="نتایج" />
                <SideLink to="/student/orders" label="سفارش‌ها" />
                <SideLink to="/student/work-reports" label="گزارش کار" />
                <SideLink to="/student/plan" label="برنامه درسی" />
                <SideLink to="/student/competition" label="مسابقات و رقابت‌ها" />
              </div>
              <div className="mt-5 rounded-2xl p-3 text-xs text-muted leading-6" style={{ background: "rgb(var(--bg-2))" }}>
                برای مشاهده برنامه اختصاصی، با حساب کاربری خود وارد شوید و تاریخ موردنظر را انتخاب کنید.
              </div>
            </Card>
          </aside>

          <section className="lg:col-span-9 min-w-0">
            <Outlet />
          </section>
        </div>
      </Container>
    </div>
  );
}
