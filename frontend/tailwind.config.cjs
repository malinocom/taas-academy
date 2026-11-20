/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Persian-first stack
        sans: [
          "Vazirmatn",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.12)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        float2: {
          "0%,100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-14px) translateX(6px)" },
        },
        enter: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0px) scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-130%) skewX(-16deg)", opacity: "0" },
          "20%": { opacity: "0.9" },
          "100%": { transform: "translateX(130%) skewX(-16deg)", opacity: "0" },
        },
        dropdown: {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0px) scale(1)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        slideInRtl: {
          "0%": { transform: "translateX(110%)" },
          "100%": { transform: "translateX(0%)" },
        },
        slideOutRtl: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(110%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        floatSlow: "float 9s ease-in-out infinite",
        float2: "float2 7s ease-in-out infinite",
        enter: "enter .65s cubic-bezier(.2,.9,.2,1) both",
        shimmer: "shimmer 1.2s ease-in-out",
        dropdown: "dropdown .22s ease-out both",
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite",
        gradient: "gradientShift 10s ease-in-out infinite",
        slideInRtl: "slideInRtl .28s cubic-bezier(.2,.9,.2,1) both",
        slideOutRtl: "slideOutRtl .22s ease-in both",
      },
    },
  },
  plugins: [],
};
