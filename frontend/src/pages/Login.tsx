import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import BookCard from "../components/BookCard";
import Reveal from "../components/Reveal";
import { IconAdmin, IconNotebook, IconPencil, IconShieldLock, IconUser } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type Mode = "student" | "admin" | "advisor";

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: JSX.Element;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 btn",
        "rounded-2xl px-4 py-3 justify-center",
        active ? "bg-white/10 soft-ring" : "bg-white/[0.06] hover:bg-white/[0.10]",
      ].join(" ")}
    >
      <span className="opacity-90">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

export default function Login() {
  const { loginStudent, loginAdmin, loginAdvisor } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();
  const loc = useLocation() as any;

  const [mode, setMode] = useState<Mode>("student");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (mode === "admin") {
      return {
        title: "ورود ادمین",
        hint: "ادمین فقط با نام کاربری/رمز از قبل تعریف‌شده وارد می‌شود. ثبت‌نام ادمین وجود ندارد.",
      };
    }
    if (mode === "advisor") {
      return {
        title: "ورود مشاور",
        hint: "مشاوران با ایمیل یا نام کاربری تعریف‌شده توسط ادمین وارد می‌شوند.",
      };
    }
    return {
      title: "ورود دانش‌آموز",
      hint: "برای شرکت در آزمون‌ها وارد شوید. ثبت‌نام فقط برای دانش‌آموز فعال است.",
    };
  }, [mode]);

  function onMode(m: Mode) {
    setMode(m);
    setError(null);
    setShowPass(false);
    setPassword("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = mode === "admin"
      ? await loginAdmin(username, password)
      : mode === "advisor"
        ? await loginAdvisor(username || email, password)
        : await loginStudent(email, password);

    if (res.ok === false) {
      const msg = res.message;
      setError(msg);
      push({ type: "error", title: "ورود ناموفق", message: msg });
      return;
    }

    push({ type: "success", title: "ورود موفق", message: mode === "admin" ? "خوش آمدی ادمین" : mode === "advisor" ? "خوش آمدی مشاور" : "خوش برگشتی" });

    const nextFromQuery = new URLSearchParams(loc.search || "").get("next");
    const to = nextFromQuery || loc?.state?.from || (mode === "admin" ? "/admin" : mode === "advisor" ? "/advisor" : "/student");
    nav(to, { replace: true });
  }

  return (
    <div className="py-12 page-enter">
      <Container>
        <div className="max-w-md mx-auto">
          <Reveal>
            <BookCard hover={false}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">ورود</div>
                  <div className="mt-2 text-2xl font-extrabold">{helper.title}</div>
                  <p className="mt-2 text-sm text-muted leading-7">{helper.hint}</p>
                  <div className="mt-3 text-xs text-muted">
                    در صورت مشکل در ورود، با پشتیبانی مجموعه هماهنگ کنید.
                  </div>
                </div>
                <div className="icon-bubble w-12 h-12">
                  {mode === "admin" ? (
                    <IconShieldLock className="text-sky-600 dark:text-cyan-300" />
                  ) : (
                    <IconNotebook className="text-[rgb(var(--text))]/80" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <TabBtn
                  active={mode === "student"}
                  onClick={() => onMode("student")}
                  label="دانش‌آموز"
                  icon={<IconNotebook size={18} />}
                />
                <TabBtn
                  active={mode === "admin"}
                  onClick={() => onMode("admin")}
                  label="ادمین"
                  icon={<IconAdmin size={18} />}
                />
                <TabBtn
                  active={mode === "advisor"}
                  onClick={() => onMode("advisor")}
                  label="مشاور"
                  icon={<IconUser size={18} />}
                />
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-3" onSubmit={submit}>
                {mode === "student" ? (
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
                ) : (
                  <div>
                    <label className="text-xs text-muted">{mode === "admin" ? "نام کاربری ادمین" : "ایمیل یا نام کاربری مشاور"}</label>
                    <input
                      className="input mt-1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === "admin" ? "admin" : "advisor@example.com"}
                      autoComplete="username"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted">رمز عبور</label>
                    <button
                      type="button"
                      className="text-xs text-sky-600 dark:text-cyan-300 hover:text-cyan-300"
                      onClick={() => setShowPass((s) => !s)}
                    >
                      {showPass ? "پنهان" : "نمایش"}
                    </button>
                  </div>
                  <input
                    className="input mt-1"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <button className="btn-primary w-full" type="submit">
                  ورود
                  <IconPencil className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-4 text-sm text-muted">
                {mode === "student" ? (
                  <>
                    حساب ندارید؟{" "}
                    <Link className="link" to="/register">
                      ثبت‌نام دانش‌آموز
                    </Link>
                  </>
                ) : mode === "admin" ? (
                  <span className="text-xs text-muted">ثبت‌نام ادمین غیرفعال است.</span>
                ) : (
                  <span className="text-xs text-muted">حساب مشاور را ادمین از پنل مشاوران خصوصی می‌سازد.</span>
                )}
              </div>
            </BookCard>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
