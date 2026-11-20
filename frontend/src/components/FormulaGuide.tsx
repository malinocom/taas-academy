import RichText from "./RichText";

type Props = {
  onClose: () => void;
};

const GUIDE = `
### راهنمای فرمول‌نویسی (ریاضی + شیمی)

**قانون اصلی:**
- ریاضی را بین \`$...$\` بنویسید (داخل متن).
- برای فرمول بزرگ وسط صفحه از \`$$...$$\` استفاده کنید.
- شیمی را با \`\\ce{...}\` بنویسید (پشتیبانی کامل با mhchem).

---

## ریاضی (KaTeX)

- توان: \`$x^2$\` ، \`$x^{n+1}$\`
- زیرنویس: \`$a_1$\` ، \`$x_{i+1}$\`
- ترکیبی: \`$x_i^2$\`
- کسر: \`$\\frac{a}{b}$\`
- رادیکال: \`$\\sqrt{2}$\` ، \`$\\sqrt[n]{x}$\`
- پرانتزِ هوشمند: \`$\\left(\\frac{a}{b}\\right)$\`
- جمع و ضرب: \`$\\sum_{i=1}^{n} i$\` ، \`$\\prod_{k=1}^{n} k$\`
- حد: \`$\\lim_{x\\to 0}\\frac{\\sin x}{x}$\`
- بردار: \`$\\vec{a}$\`
- نمای علمی: \`$6.02\\times 10^{23}$\`

---

## شیمی (mhchem)

- فرمول‌ها: \`\\ce{H2O}\` ، \`\\ce{H2SO4}\`
- یون/بار: \`\\ce{Na+}\` ، \`\\ce{SO4^{2-}}\`
- واکنش: \`\\ce{2H2 + O2 -> 2H2O}\`
- حالت‌ها: \`\\ce{H2O(l)}\` ، \`\\ce{CO2(g)}\`

### عدد جرمی و عدد اتمی (ایزوتوپ)
- کربن-۱۴ با عدد اتمی ۶: \`\\ce{^{14}_{6}C}\`
- اورانیوم-۲۳۵ با عدد اتمی ۹۲: \`\\ce{^{235}_{92}U}\`

---

### نکته اکسل
اگر اکسل چیزی را «فرمول» تشخیص داد و اولش \`=\` گذاشت، بهتر است اول سلول یک \`'\` (آپوستروف) بگذارید تا متن خراب نشود.
`;

export default function FormulaGuide({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl glass p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="font-extrabold">راهنمای فرمول‌نویسی</div>
          <button className="btn-ghost" onClick={onClose}>
            بستن
          </button>
        </div>
        <div className="mt-4 text-sm leading-7 text-muted">
          <RichText text={GUIDE} />
        </div>
      </div>
    </div>
  );
}
