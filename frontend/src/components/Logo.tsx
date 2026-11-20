export default function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className={["relative grid place-items-center", small ? "h-9 w-9" : "h-10 w-10"].join(" ")}>
        <img
          src="/brand/logo.png"
          alt="لوگو"
          onError={(e) => {
            // Fallback to svg template if png is not provided
            (e.currentTarget as HTMLImageElement).src = "/brand/logo.svg";
          }}
          className={[
            "h-full w-full rounded-full shadow-glass transition-transform duration-500",
            "ring-1 ring-black/5 dark:ring-white/10",
            "motion-safe:animate-floatSlow hover:rotate-6",
          ].join(" ")}
        />
      </div>
      <div className="leading-tight">
        <div className={["font-extrabold", small ? "text-sm" : "text-base"].join(" ")}>تـــاس</div>
        <div className="text-xs text-muted">موسسه مشاوره تحصیلی</div>
      </div>
    </div>
  );
}
