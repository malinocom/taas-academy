import Container from "./Container";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-10 border-t" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}>
      <div className="h-[3px] w-full bg-gradient-to-r from-cyan-400 via-sky-600 to-cyan-300" />
      <Container>
        <div className="py-12 grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <Logo small />
            <p className="text-sm text-muted leading-8">همراهی هوشمندانه در مسیر موفقیت تحصیلی؛ از برنامه‌ریزی تا ارزیابی و پیگیری.</p>
            <div className="text-xs text-muted">برنامه‌ریزی دقیق • ارزیابی مستمر • همراهی تخصصی</div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="font-semibold">دسترسی سریع</div>
            <ul className="text-sm text-muted space-y-2">
              <li><a className="link" href="/">صفحه اصلی</a></li>
              <li><a className="link" href="/courses">دوره ها</a></li>
              <li><a className="link" href="/advisors">مشاوران</a></li>
              <li><a className="link" href="/about">درباره ما</a></li>
              <li><a className="link" href="/help">راهنمای سایت</a></li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="font-semibold">شماره های تماس</div>
            <div className="glass rounded-3xl p-4">
              <div className="text-sm font-semibold">ساعات کاری از ۹:۳۰ صبح الی ۱۸</div>
              <div className="mt-3 text-sm text-muted space-y-1">
                <a className="block hover:text-[rgb(var(--accent-2))] transition" dir="ltr" href="tel:09374620405">09374620405</a>
                <a className="block hover:text-[rgb(var(--accent-2))] transition" dir="ltr" href="tel:09922457471">09922457471</a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 border-t text-xs text-muted flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between" style={{ borderColor: "rgb(var(--border))" }}>
          <div>© {new Date().getFullYear()} آکادمی تاس</div>
          <div className="opacity-80">سامانه آموزشی و مشاوره‌ای تاس</div>
        </div>
      </Container>
    </footer>
  );
}
