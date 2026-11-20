import React, { useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { IconBook, IconCart, IconClipboardCheck, IconTarget, IconUser } from "../components/Icons";
import HeroVisual from "../components/HeroVisual";
import { useToast } from "../context/ToastContext";
import { createBookingDb } from "../lib/db";

const WHY = [
  "برنامه‌ریزی متناسب با پایه، هدف و شرایط هر دانش‌آموز",
  "آزمون آنلاین و دسترسی به کارنامه و تحلیل عملکرد",
  "امکان پیگیری برنامه درسی و گزارش فعالیت‌ها در پنل شخصی",
  "ارتباط با مشاوران و ثبت درخواست مشاوره از طریق سامانه",
  "دسترسی یکپارچه به منابع و خدمات آموزشی تاس",
];

function Feature({
  title,
  desc,
  icon,
  note,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <div
      className="group h-full rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glass"
      style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--glass-bg))" }}
    >
      <div className="flex items-start gap-3">
        <div className="icon-bubble w-12 h-12">{icon}</div>
        <div className="min-w-0">
          <div className="font-semibold flex items-center gap-2">
            {title}
            {note ? (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                {note}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted leading-7">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { push } = useToast();
  const [sending, setSending] = useState(false);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [major, setMajor] = useState("");
  const [goal, setGoal] = useState("");
  const [hadAdvisorBefore, setHadAdvisorBefore] = useState(false);
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [advisorChoice, setAdvisorChoice] = useState("انتخاب کنید");
  const [cancelReason, setCancelReason] = useState("");

  async function submitBooking() {
    if (!fullName.trim() || !grade.trim() || !major.trim() || !goal.trim() || !phone.trim()) {
      push({ type: "error", title: "خطا", message: "لطفاً فیلدهای ضروری را کامل کنید." });
      return;
    }
    if (advisorChoice === "انتخاب کنید") {
      push({ type: "error", title: "خطا", message: "لطفاً مشاور را انتخاب کنید." });
      return;
    }

    setSending(true);
    try {
      await createBookingDb({
        fullName: fullName.trim(),
        grade: grade.trim(),
        major: major.trim(),
        goal: goal.trim(),
        hadAdvisorBefore,
        phone: phone.trim(),
        parentPhone: parentPhone.trim() || undefined,
        advisorChoice,
        cancelReason: cancelReason.trim() || undefined,
      });
      push({ type: "success", title: "ثبت شد", message: "درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم." });
      setFullName("");
      setGrade("");
      setMajor("");
      setGoal("");
      setHadAdvisorBefore(false);
      setPhone("");
      setParentPhone("");
      setAdvisorChoice("انتخاب کنید");
      setCancelReason("");
    } catch (e: any) {
      push({ type: "error", title: "خطا", message: e?.message ?? "ثبت درخواست ناموفق بود" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative overflow-hidden page-enter">
      <div className="absolute inset-0 bg-grid [background-size:22px_22px] opacity-[0.045] pointer-events-none" />

      <Container>
        {/* Hero */}
        <section className="relative grid lg:grid-cols-12 items-center gap-8 py-12 sm:py-16 lg:py-20">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              <Badge>آموزش و مشاوره تحصیلی</Badge>
              <Badge>همراهی تا رسیدن به هدف</Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-5xl font-black leading-[1.3] tracking-tight">
              مسیر موفقیت تحصیلی،<br />
              <span className="text-sky-700 dark:text-cyan-300">با برنامه‌ای برای خودت</span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm sm:text-base text-muted leading-8">
              در آکادمی تاس، مشاوره، برنامه‌ریزی، آزمون و تحلیل عملکرد در کنار هم قرار می‌گیرند تا با شناخت شرایطت، قدم بعدی را آگاهانه‌تر برداری.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link to="/exams" className="btn-primary">
                مشاهده آزمون‌های آنلاین
                <IconTarget className="h-4 w-4" />
              </Link>
              <a href="#reserve" className="btn-ghost">رزرو مشاوره تحصیلی</a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /> برنامه‌ریزی متناسب با شرایط</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /> ارزیابی و تحلیل عملکرد</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /> همراهی مشاوران تخصصی</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroVisual />
          </div>
        </section>

        {/* Features */}
        <section className="pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-sky-700 dark:text-cyan-300">خدمات آکادمی</div>
              <h2 className="mt-2 text-2xl font-extrabold">همه ابزارهای مسیر تحصیلی در یک سامانه</h2>
            </div>
            <Link to="/help" className="link text-sm">راهنمای استفاده از سایت</Link>
          </div>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/exams" className="block"><Feature title="آزمون آنلاین" desc="شرکت در آزمون، ثبت پاسخ و دریافت کارنامه و تحلیل." icon={<IconClipboardCheck />} /></Link>
            <Link to="/courses" className="block"><Feature title="دوره‌های آموزشی" desc="دسترسی به محتوای آموزشی و دوره‌های مجموعه." icon={<IconBook />} /></Link>
            <Link to="/advisors" className="block"><Feature title="مشاوران تخصصی" desc="آشنایی با تیم مشاوره و انتخاب مسیر مناسب." icon={<IconUser />} /></Link>
            <Link to="/shop" className="block"><Feature title="فروشگاه جزوه" desc="مشاهده و تهیه منابع آموزشی موردنیاز." icon={<IconCart />} /></Link>
          </div>
        </section>

        {/* Why us */}
        <section className="pb-16">
          <Card hover={false}>
            <div className="text-xl sm:text-2xl font-extrabold">تسلیم شدن در شأن ما نبود و در شأن شما هم نیست</div>
            <div className="mt-2 text-sm text-muted">چرا باید آکادمی تـــاس را انتخاب کنیم؟</div>
            <ul className="mt-5 space-y-2 text-sm text-muted leading-8">
              {WHY.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
            <div className="mt-6">
              <a href="#reserve" className="btn-primary">
                نیاز به مشاوره دارید؟ همین الان رزرو کنید
              </a>
            </div>
          </Card>
        </section>

        {/* Reserve */}
        <section id="reserve" className="pb-16">
          <div className="text-2xl font-extrabold">رزرو مشاوره تحصیلی</div>
          <p className="mt-2 text-sm text-muted">اطلاعات زیر را وارد کنید تا با شما تماس بگیریم.</p>

          <div className="mt-5 grid lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-7" hover={false}>
              <form className="grid sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); void submitBooking(); }}>
                <label className="text-sm">
                  نام و نام‌خانوادگی
                  <input className="input mt-1" placeholder="مثلاً: علی رضایی" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label className="text-sm">
                  پایه
                  <input className="input mt-1" placeholder="مثلاً: دوازدهم" value={grade} onChange={(e) => setGrade(e.target.value)} />
                </label>
                <label className="text-sm sm:col-span-2">
                  رشته (مثلاً: تجربی، ریاضی، انسانی)
                  <input className="input mt-1" placeholder="مثلاً: تجربی" value={major} onChange={(e) => setMajor(e.target.value)} />
                </label>
                <label className="text-sm sm:col-span-2">
                  هدف شما (مثلاً: سراسری، فرهنگیان...)
                  <input className="input mt-1" placeholder="مثلاً: سراسری" value={goal} onChange={(e) => setGoal(e.target.value)} />
                </label>
                <label className="text-sm">
                  مشاور قبلاً داشتید؟
                  <select className="input mt-1" value={hadAdvisorBefore ? "بله" : "خیر"} onChange={(e) => setHadAdvisorBefore(e.target.value === "بله")}>
                    <option>خیر</option>
                    <option>بله</option>
                  </select>
                </label>
                <label className="text-sm">
                  شماره تلفن شما
                  <input className="input mt-1" placeholder="09xxxxxxxxx" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="text-sm">
                  شماره یکی از والدین (اختیاری)
                  <input className="input mt-1" placeholder="09xxxxxxxxx" dir="ltr" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                </label>
                <label className="text-sm">
                  انتخاب مشاور
                  <select className="input mt-1" value={advisorChoice} onChange={(e) => setAdvisorChoice(e.target.value)}>
                    <option>انتخاب کنید</option>
                    <option>ابوالفضل بهاری</option>
                    <option>زینب ارجمند</option>
                    <option>مهدی شاور</option>
                    <option>هانیه نوربخت</option>
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  اگر قبلاً مشاور داشتید، دلیل کنسلی را وارد کنید (اختیاری)
                  <input className="input mt-1" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                </label>

                <button type="submit" className="btn-primary sm:col-span-2" disabled={sending}>
                  {sending ? "در حال ارسال…" : "ارسال درخواست"}
                </button>
              </form>
            </Card>

            <Card className="lg:col-span-5" hover={false}>
              <div className="text-lg font-extrabold">نظرات دانش آموزان ما</div>
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))" }}>
                  <div className="font-bold">سعید تقی زاده</div>
                  <div className="text-xs text-muted mt-1">دانش آموز دوازدهم رشته انسانی</div>
                  <p className="mt-3 text-sm text-muted leading-7">
                    آموزش‌ها و نکات مشاوره‌ای‌شون واقعاً کاربردی بود و باعث شد هم معدل ترم‌م بهتر بشه هم آرامش بیشتری بگیرم.تاس برام فقط یه آموزشگاه نیست؛ واقعاً حس می‌کنم یه تیم پشت منه.
                  </p>
                </div>
                <div className="rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))" }}>
                  <div className="font-bold">ایلیا منیری</div>
                  <div className="text-xs text-muted mt-1">دانش آموز دوازدهم رشته تجربی</div>
                  <p className="mt-3 text-sm text-muted leading-7">
                    قبل از آشنایی با مؤسسه تـــاس، برنامه‌ی مشخصی برای درس‌خوندن نداشتم و هر روز استرس کنکور داشتم. اما مشاورم توی تاس دقیقاً مطابق شرایط خودم یه برنامه‌ریزی قابل‌اجرا بهم داد و هر هفته هم پشتیبانم وضعیت مطالعه‌مو بررسی می‌کرد.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Start guide */}
        <section className="pb-16">
          <div className="text-2xl font-extrabold">از کجا شروع کنی؟</div>
          <p className="mt-2 text-sm text-muted leading-7">برای استفاده از خدمات تاس، مسیر مناسب خودت را انتخاب کن.</p>
          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <Link to="/register" className="help-shortcut">
              <div className="icon-bubble h-11 w-11"><IconUser /></div>
              <div className="mt-4 font-bold">ساخت حساب کاربری</div>
              <p className="mt-2 text-xs text-muted leading-6">برای دسترسی به پنل شخصی و مشاهده نتایج، حساب بساز.</p>
              <span className="help-shortcut-arrow">←</span>
            </Link>
            <Link to="/exams" className="help-shortcut">
              <div className="icon-bubble h-11 w-11"><IconClipboardCheck /></div>
              <div className="mt-4 font-bold">مشاهده آزمون‌ها</div>
              <p className="mt-2 text-xs text-muted leading-6">آزمون‌های در دسترس را ببین و عملکردت را ارزیابی کن.</p>
              <span className="help-shortcut-arrow">←</span>
            </Link>
            <Link to="/help" className="help-shortcut">
              <div className="icon-bubble h-11 w-11"><IconTarget /></div>
              <div className="mt-4 font-bold">راهنمای سامانه</div>
              <p className="mt-2 text-xs text-muted leading-6">پاسخ پرسش‌های متداول و راهنمای بخش‌های سایت.</p>
              <span className="help-shortcut-arrow">←</span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <Card hover={false}>
            <div className="text-2xl sm:text-3xl font-extrabold">شما لایق درخشیدن هستید !</div>
            <p className="mt-3 text-sm text-muted leading-8">انتخاب درست امروز، آینده روشن فردا؛ تاس کنار توست.</p>
          </Card>
        </section>
      </Container>
    </div>
  );
}
