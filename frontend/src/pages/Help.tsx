import { Link } from "react-router-dom";
import Container from "../components/Container";
import Card from "../components/Card";
import { IconBook, IconClipboardCheck, IconRocket, IconShieldLock, IconTarget } from "../components/Icons";

const FAQS = [
  {
    question: "چطور در آزمون آنلاین شرکت کنم؟",
    answer: "ابتدا وارد حساب کاربری شوید، از بخش آزمون آنلاین آزمون موردنظر را انتخاب کنید و پس از بررسی زمان و شرایط، شروع آزمون را بزنید.",
  },
  {
    question: "نتیجه و تحلیل آزمون را از کجا ببینم؟",
    answer: "بعد از ثبت نهایی پاسخ‌ها، از پنل دانش‌آموز وارد بخش نتایج شوید. در صفحه هر آزمون می‌توانید کارنامه و تحلیل عملکرد را مشاهده کنید.",
  },
  {
    question: "برنامه‌ریزی اختصاصی برای چه کسانی فعال است؟",
    answer: "بخش برنامه درسی خصوصی برای دانش‌آموزانی فعال است که به‌عنوان دانش‌آموز خصوصی در سامانه تعریف شده‌اند. برنامه را مشاور یا مدیر مجموعه ثبت می‌کند.",
  },
  {
    question: "اگر فایل PDF آزمون باز نشد چه کار کنم؟",
    answer: "از دکمه باز کردن در صفحه جدید یا دانلود PDF استفاده کنید. اگر مشکل ادامه داشت، مرورگر را به‌روز کنید و از پشتیبانی مجموعه کمک بگیرید.",
  },
  {
    question: "چطور درخواست مشاوره ثبت کنم؟",
    answer: "در صفحه اصلی فرم رزرو مشاوره را تکمیل کنید. پس از ثبت درخواست، همکاران مجموعه برای پیگیری با شما تماس می‌گیرند.",
  },
];

const SHORTCUTS = [
  { to: "/exams", title: "آزمون آنلاین", description: "مشاهده آزمون‌ها و شرکت در آزمون", icon: <IconClipboardCheck size={21} /> },
  { to: "/advisors", title: "مشاوران", description: "آشنایی با مشاوران مجموعه", icon: <IconTarget size={21} /> },
  { to: "/shop", title: "فروشگاه جزوه", description: "مشاهده و تهیه منابع آموزشی", icon: <IconBook size={21} /> },
  { to: "/login", title: "ورود به حساب", description: "دسترسی به پنل دانش‌آموز یا مشاور", icon: <IconShieldLock size={21} /> },
];

export default function Help() {
  return (
    <div className="py-10 page-enter">
      <Container>
        <section className="help-hero">
          <div className="help-hero-icon"><IconRocket size={27} /></div>
          <div className="text-xs font-semibold tracking-wide text-muted">مرکز راهنمای آکادمی تاس</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black">همه‌چیز برای شروع، یک‌جا</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted leading-8">
            راهنمای بخش‌های سامانه، پاسخ پرسش‌های متداول و دسترسی سریع به خدمات آموزشی تاس.
          </p>
          <a href="/#reserve" className="btn-primary mt-5">درخواست مشاوره</a>
        </section>

        <section className="mt-9">
          <div className="text-xl font-extrabold">دسترسی سریع</div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SHORTCUTS.map((item) => (
              <Link to={item.to} key={item.to} className="help-shortcut">
                <div className="icon-bubble h-11 w-11">{item.icon}</div>
                <div className="mt-4 font-bold">{item.title}</div>
                <p className="mt-2 text-xs text-muted leading-6">{item.description}</p>
                <span className="help-shortcut-arrow">←</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 grid lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8">
            <div className="text-xl font-extrabold">پرسش‌های متداول</div>
            <div className="mt-4 space-y-3">
              {FAQS.map((item) => (
                <details className="help-faq" key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <Card hover={false} className="lg:col-span-4">
            <div className="text-lg font-extrabold">هنوز سؤالی دارید؟</div>
            <p className="mt-2 text-sm text-muted leading-7">
              اگر برای ورود، آزمون، برنامه درسی یا ثبت درخواست به راهنمایی نیاز دارید، با مجموعه در ارتباط باشید.
            </p>
            <div className="mt-5 space-y-3">
              <a href="tel:09374620405" className="help-contact" dir="ltr">09374620405</a>
              <a href="tel:09922457471" className="help-contact" dir="ltr">09922457471</a>
              <a href="/#reserve" className="btn-primary w-full mt-2">ثبت درخواست مشاوره</a>
            </div>
          </Card>
        </section>
      </Container>
    </div>
  );
}
