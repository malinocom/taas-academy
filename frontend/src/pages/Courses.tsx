import { Link } from "react-router-dom";
import Container from "../components/Container";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { IconBook, IconClipboardCheck, IconTarget } from "../components/Icons";

const PATHS = [
  { title: "یادگیری هدفمند", text: "محتوای آموزشی با تمرکز بر یادگیری عمیق و مرور مؤثر.", icon: <IconBook /> },
  { title: "تمرین و ارزیابی", text: "استفاده از آزمون‌ها برای سنجش آموخته‌ها و شناسایی نقاط قابل بهبود.", icon: <IconClipboardCheck /> },
  { title: "برنامه‌ریزی و پیگیری", text: "تبدیل هدف‌های درسی به برنامه‌ای منظم و قابل اجرا.", icon: <IconTarget /> },
];

export default function Courses() {
  return (
    <div className="py-10 page-enter">
      <Container>
        <Card hover={false} className="help-hero">
          <Badge>مسیرهای آموزشی آکادمی</Badge>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black">یادگیری با مسیر روشن</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted leading-8">
            در تاس، آموزش در کنار تمرین، ارزیابی و برنامه‌ریزی معنا پیدا می‌کند. برای اطلاع از دوره‌های فعال و شرایط ثبت‌نام، درخواست خود را برای مجموعه ارسال کنید.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/#reserve" className="btn-primary">دریافت مشاوره</a>
            <Link to="/exams" className="btn-ghost">مشاهده آزمون‌ها</Link>
          </div>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {PATHS.map((path) => (
            <Card key={path.title} hover={false}>
              <div className="icon-bubble h-12 w-12">{path.icon}</div>
              <h2 className="mt-4 font-extrabold">{path.title}</h2>
              <p className="mt-2 text-sm text-muted leading-7">{path.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
