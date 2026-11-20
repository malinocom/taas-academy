import { IconBook, IconChart, IconClipboardCheck, IconRocket, IconTarget } from "./Icons";

const STEPS = [
  { title: "هدف‌گذاری", detail: "شناخت مسیر و اولویت‌ها", icon: <IconTarget size={19} /> },
  { title: "برنامه‌ریزی", detail: "برنامه متناسب با شرایط شما", icon: <IconBook size={19} /> },
  { title: "ارزیابی", detail: "آزمون و سنجش منظم", icon: <IconClipboardCheck size={19} /> },
  { title: "بهبود مسیر", detail: "تحلیل نتیجه و اصلاح برنامه", icon: <IconChart size={19} /> },
];

export default function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="مراحل پیشرفت تحصیلی در آکادمی تاس">
      <div className="hero-visual-orbit hero-visual-orbit-one" />
      <div className="hero-visual-orbit hero-visual-orbit-two" />
      <div className="hero-visual-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted">مسیر همراهی تاس</div>
            <div className="mt-1 text-lg font-extrabold">از برنامه تا پیشرفت</div>
          </div>
          <div className="hero-visual-mark"><IconRocket size={23} /></div>
        </div>

        <div className="hero-steps mt-6">
          {STEPS.map((step, index) => (
            <div className="hero-step" key={step.title}>
              <div className="hero-step-index">{(index + 1).toLocaleString("fa-IR")}</div>
              <div className="hero-step-icon">{step.icon}</div>
              <div className="min-w-0">
                <div className="font-bold text-sm">{step.title}</div>
                <div className="mt-1 text-xs text-muted leading-6">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-visual-footer">
          <span className="hero-visual-footer-dot" />
          <span>هر دانش‌آموز، یک مسیر اختصاصی</span>
        </div>
      </div>
    </div>
  );
}
