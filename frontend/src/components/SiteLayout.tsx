import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import ToastViewport from "./ToastViewport";

function RouteScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = window.setTimeout(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => window.clearTimeout(id);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <RouteScrollReset />
      <ScrollProgress />
      <Header />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <ToastViewport />
    </div>
  );
}
