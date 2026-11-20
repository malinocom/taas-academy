import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Container from "./Container";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconAdmin, IconBookStack, IconClipboardCheck, IconClose, IconMenu, IconMoon, IconSparkles, IconSun, IconUser } from "./Icons";

function NavItem({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink to={to} onClick={onClick}>
      {({ isActive }) => (
        <div
          className={[
            "group px-3 py-2 rounded-2xl text-sm transition flex items-center gap-2",
            isActive
              ? "bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-3))] soft-ring"
              : "text-slate-700 dark:text-[rgb(var(--text))]/80 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
          ].join(" ")}
        >
          <span className="opacity-80 group-hover:opacity-100">{icon}</span>
          <span>{label}</span>
          <span
            className={[
              "ms-auto h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-2))] transition",
              isActive ? "opacity-100 scale-100" : "opacity-0 scale-0",
            ].join(" ")}
          />
        </div>
      )}
    </NavLink>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = useMemo(() => {
    const base = [
      { to: "/", label: "صفحه اصلی", icon: <span className="text-xs">🏠</span> },
      { to: "/courses", label: "دوره ها", icon: <IconSparkles size={18} /> },
      { to: "/advisors", label: "مشاوران", icon: <IconUser size={18} /> },
      { to: "/shop", label: "فروشگاه", icon: <span className="text-xs">🛒</span> },
      { to: "/exams", label: "آزمون آنلاین", icon: <IconClipboardCheck size={18} /> },
      { to: "/help", label: "راهنما", icon: <IconBookStack size={18} /> },
    ];

    if (user?.role === "student") base.push({ to: "/student", label: "پنل دانش‌آموز", icon: <IconUser size={18} /> });
    if (user?.role === "advisor") base.push({ to: "/advisor", label: "پنل مشاور", icon: <IconUser size={18} /> });
    if (user?.role === "admin") base.push({ to: "/admin", label: "پنل مدیریت", icon: <IconAdmin size={18} /> });

    return base;
  }, [user?.role]);

  const isAuthPage = location.pathname.startsWith("/login") || location.pathname.startsWith("/register");

  return (
    <header
      className={[
        // Higher z-index to ensure header and mobile menu always sit above page content
        "sticky top-0 z-[80] transition",
        "backdrop-blur-2xl border-b",
        scrolled ? "shadow-glass" : "",
      ].join(" ")}
      style={{
        borderColor: "rgb(var(--border))",
        background: scrolled ? "rgb(var(--bg) / 0.86)" : "rgb(var(--bg) / 0.68)",
      }}
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-cyan-400 via-sky-600 to-cyan-300" />

      <Container>
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="hover:opacity-95 transition">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} />
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button className="btn-ghost" onClick={toggle} aria-label="تغییر تم">
              {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            {!user ? (
              <>
                <Link to="/login" className="btn-ghost">
                  ورود
                </Link>
                <Link to="/register" className="btn-primary">
                  ثبت‌نام
                </Link>
              </>
            ) : (
              <>
                <div className="text-xs text-muted px-3 py-2 rounded-2xl border soft-ring" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--glass-bg))" }}>
                  <span className="text-[rgb(var(--text))] font-semibold">{user.name}</span>{" "}
                  <span className="opacity-70">({user.role === "admin" ? "مدیر" : user.role === "advisor" ? "مشاور" : "دانش‌آموز"})</span>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    void logout();
                    if (!isAuthPage) navigate("/");
                  }}
                >
                  خروج
                </button>
              </>
            )}
          </div>

          <button
            className="lg:hidden btn-ghost px-3 py-2"
            onClick={() => setOpen(true)}
            aria-label="باز کردن منو"
            aria-expanded={open}
          >
            <IconMenu />
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {typeof document !== "undefined"
        ? createPortal(
            <div
              className={[
                "fixed inset-0 lg:hidden transition",
                open ? "pointer-events-auto" : "pointer-events-none",
              ].join(" ")}
              style={{ zIndex: 9999 }}
              aria-hidden={!open}
            >
              <div
                className={[
                  "absolute inset-0 transition-opacity",
                  open ? "opacity-100" : "opacity-0",
                ].join(" ")}
                style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
                onClick={() => setOpen(false)}
              />

              <div
                className={[
                  "absolute inset-y-0 right-0 w-[86%] max-w-sm",
                  "border-l shadow-glass",
                  "transition-transform duration-300",
                  open ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
                style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
              >
                <div className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <Logo small />
                    <button className="btn-ghost px-3 py-2" onClick={() => setOpen(false)} aria-label="بستن منو">
                      <IconClose />
                    </button>
                  </div>

                  <div className="mt-4 rounded-3xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--glass-bg))" }}>
                    {!user ? (
                      <div className="flex gap-2">
                        <Link to="/login" className="btn-ghost flex-1">
                          ورود
                        </Link>
                        <Link to="/register" className="btn-primary flex-1">
                          ثبت‌نام
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-muted">{user.role === "admin" ? "مدیر سامانه" : user.role === "advisor" ? "مشاور" : "دانش‌آموز"}</div>
                        </div>
                        <button
                          className="btn-ghost"
                          onClick={() => {
                            void logout();
                            if (!isAuthPage) navigate("/");
                          }}
                        >
                          خروج
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-3xl border p-3" style={{ borderColor: "rgb(var(--border))" }}>
                    <div className="text-xs text-muted">حالت نمایش</div>
                    <button className="btn-ghost" onClick={toggle}>
                      {theme === "dark" ? (
                        <span className="flex items-center gap-2"><IconSun size={18} /> روز</span>
                      ) : (
                        <span className="flex items-center gap-2"><IconMoon size={18} /> شب</span>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 space-y-1">
                    {links.map((l) => (
                      <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} onClick={() => setOpen(false)} />
                    ))}
                  </div>

                  <div className="mt-6 text-xs text-muted">تاس • موسسه مشاوره تحصیلی</div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
