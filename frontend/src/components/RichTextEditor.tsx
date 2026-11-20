import { useState } from "react";
import RichText from "./RichText";
import FormulaGuide from "./FormulaGuide";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
};

export default function RichTextEditor({ label, value, onChange, placeholder, rows = 4 }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-muted">{label}</label>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost" onClick={() => setShowGuide(true)}>
            ؟ راهنما
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShowPreview((x) => !x)}>
            {showPreview ? "پنهان کردن پیش‌نمایش" : "نمایش پیش‌نمایش"}
          </button>
        </div>
      </div>
      <textarea
        className="textarea mt-1"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />

      {showPreview ? (
        <div className="mt-2 rounded-2xl border p-3" style={{ borderColor: "rgb(var(--border))" }}>
          <div className="text-xs text-muted">پیش‌نمایش</div>
          <RichText text={value || "(خالی)"} className="mt-2 leading-7" />
        </div>
      ) : null}

      {showGuide ? <FormulaGuide onClose={() => setShowGuide(false)} /> : null}
    </div>
  );
}
