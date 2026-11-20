import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import Reveal from "../components/Reveal";
import { IconNotebook, IconPencil, IconRocket, IconUser } from "../components/Icons";
import type { Major } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const MAJORS: Major[] = ["عمومی", "ریاضی", "تجربی", "انسانی"];
const GRADES = ["دهم", "یازدهم", "دوازدهم", "کنکور", "نهم", "هشتم", "هفتم", "دیگر"];

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw) || /[a-z]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  const pct = Math.min(100, Math.round((score / 5) * 100));
  const label = pct >= 80 ? "قوی" : pct >= 55 ? "متوسط" : "ضعیف";
  return { pct, label };
}

export default function Register() {
  const { registerStudent } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [major, setMajor] = useState<Major>("عمومی");
  const [grade, setGrade] = useState("دوازدهم");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  function validateStep1() {
    if (!name.trim()) return "نام را وارد کنید.";
    if (!MAJORS.includes(major)) return "رشته تحصیلی معتبر نیست.";
    if (!grade.trim()) return "پایه تحصیلی را انتخاب کنید.";
    return null;
  }

  function validateStep2() {
    if (!phone.trim() || phone.replace(/\s/g, "").length < 10) return "شماره تماس معتبر نیست.";
    if (!nationalId.trim() || nationalId.replace(/\s/g, "").length !== 10) return "کد ملی باید ۱۰ رقم باشد.";
    if (!email.includes("@")) return "ایمیل معتبر نیست.";
    if (password.length < 6) return "رمز عبور حداقل ۶ کاراکتر باشد.";
    if (password !== password2) return "رمز و تکرار رمز یکسان نیست.";
    return null;
  }

  function next() {
    const err = validateStep1();
    if (err) {
      setError(err);
      push({ type: "error", title: "خطا", message: err });
      return;
    }
    setError(null);
    setStep(2);
  }

  function back() {
    setError(null);
    setStep(1);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const err1 = validateStep1();
    if (err1) {
      setError(err1);
      push({ type: "error", title: "خطا", message: err1 });
      setStep(1);
      return;
    }

    const err2 = validateStep2();
    if (err2) {
      setError(err2);
      push({ type: "error", title: "خطا", message: err2 });
      return;
    }

    const res = await registerStudent(name, email, password, { major, grade, phone, nationalId, address });
    if (res.ok === false) {
      const msg = res.message;
      setError(msg);
      push({ type: "error", title: "ثبت‌نام ناموفق", message: msg });
      return;
    }

    push({ type: "success", title: "ثبت‌نام انجام شد", message: "خوش اومدی! 🎉" });
    nav("/student", { replace: true });
  }

  return (
    <div className="py-12 page-enter">
      <Container>
        <div className="max-w-md mx-auto">
          <Reveal>
            <BookCard hover={false}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">ثبت‌نام دانش‌آموز</div>
                  <div className="mt-2 text-2xl font-extrabold">شروع کن</div>
                  <p className="mt-2 text-sm text-muted leading-7">
                    ثبت‌نام فقط برای دانش‌آموز فعال است. لطفاً اطلاعات را دقیق وارد کنید.
                  </p>
                </div>
                <div className="icon-bubble w-12 h-12">
                  <IconRocket className="text-cyan-600 dark:text-cyan-300" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <span className={["chip", step === 1 ? "bg-white/10" : ""].join(" ")}>مرحله ۱</span>
                <span className="text-xs text-muted">→</span>
                <span className={["chip", step === 2 ? "bg-white/10" : ""].join(" ")}>مرحله ۲</span>
                <span className="ms-auto text-xs text-muted">{step.toLocaleString("fa-IR")} / ۲</span>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={submit}>
                {step === 1 ? (
                  <>
                    <div>
                      <label className="text-xs text-muted">نام و نام خانوادگی</label>
                      <div className="mt-1 relative">
                        <input
                          className="input pr-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                          <IconUser size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted">پایه تحصیلی</label>
                        <select className="input mt-1" value={grade} onChange={(e) => setGrade(e.target.value)}>
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted">رشته تحصیلی</label>
                      <select className="input mt-1" value={major} onChange={(e) => setMajor(e.target.value as Major)}>
                        {MAJORS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                        <div className="mt-2 text-xs text-muted leading-6">برای پیشنهاد آزمون/درس و فیلترها استفاده می‌شود.</div>
                      </div>
                    </div>

                    <button type="button" className="btn-primary w-full" onClick={next}>
                      ادامه
                      <IconNotebook className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted">شماره تماس</label>
                        <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912..." autoComplete="tel" />
                      </div>
                      <div>
                        <label className="text-xs text-muted">کد ملی</label>
                        <input className="input mt-1" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="۱۰ رقم" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted">ایمیل</label>
                      <input
                        className="input mt-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted">آدرس (اختیاری)</label>
                      <textarea className="textarea mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted">رمز عبور</label>
                        <button
                          type="button"
                          className="text-xs text-sky-700 dark:text-cyan-300 hover:opacity-90"
                          onClick={() => setShowPass((s) => !s)}
                        >
                          {showPass ? "پنهان" : "نمایش"}
                        </button>
                      </div>
                      <div className="mt-1 relative">
                        <input
                          className="input pr-10"
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                          <IconPencil size={18} />
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>قدرت رمز</span>
                          <span className="font-semibold">{strength.label}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-2) / 0.6)" }}>
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 via-sky-600 to-cyan-300"
                            style={{ width: `${strength.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted">تکرار رمز عبور</label>
                      <input
                        className="input mt-1"
                        type={showPass ? "text" : "password"}
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="btn-ghost w-full" onClick={back}>
                        بازگشت
                      </button>
                      <button className="btn-primary w-full" type="submit">
                        ساخت حساب
                        <IconRocket className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-4 text-sm text-muted">
                قبلاً ثبت‌نام کردی؟{" "}
                <Link className="link" to="/login">
                  ورود
                </Link>
              </div>
            </BookCard>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
