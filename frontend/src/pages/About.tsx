import Container from "../components/Container";
import Card from "../components/Card";
import { IconBook, IconChart, IconTarget } from "../components/Icons";

const VALUES = [
  { title: "شناخت شرایط هر دانش‌آموز", text: "برنامه‌ریزی زمانی مؤثر است که با پایه، رشته، هدف و شرایط واقعی فرد هماهنگ باشد.", icon: <IconTarget /> },
  { title: "ارزیابی مستمر", text: "آزمون و تحلیل کمک می‌کند نقاط قوت و بخش‌های نیازمند تمرین دقیق‌تر دیده شوند.", icon: <IconChart /> },
  { title: "یادگیری همراه با پیگیری", text: "هدف فقط ارائه برنامه نیست؛ استمرار، بازبینی و اصلاح مسیر هم اهمیت دارد.", icon: <IconBook /> },
];

export default function About() {
  return (
    <div className="py-10 page-enter">
      <Container>
        <Card hover={false} className="help-hero">
          <div className="text-xs font-semibold text-muted">درباره آکادمی تاس</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black">هر هدف بزرگی، به یک مسیر روشن نیاز دارد.</h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base text-muted leading-8">
            آکادمی تاس بستری برای همراهی تحصیلی دانش‌آموزان است؛ از مشاوره و برنامه‌ریزی تا آزمون آنلاین، بررسی نتایج و پیگیری روند پیشرفت.
          </p>
          <a href="/#reserve" className="btn-primary mt-6">ارتباط با مجموعه</a>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {VALUES.map((item) => (
            <Card key={item.title} hover={false}>
              <div className="icon-bubble h-12 w-12">{item.icon}</div>
              <h2 className="mt-4 font-extrabold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted leading-7">{item.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
