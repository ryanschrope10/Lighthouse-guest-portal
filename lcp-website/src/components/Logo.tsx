type Props = { className?: string; variant?: "dark" | "light" };

export default function Logo({ className = "", variant = "dark" }: Props) {
  const wordColor = variant === "light" ? "text-cream-100" : "text-ink-900";
  const markBg = variant === "light" ? "bg-cream-100" : "bg-forest-700";
  const markFg = variant === "light" ? "text-forest-800" : "text-cream-100";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${markBg} ${markFg} shadow-soft`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M12 2 L14 7 L10 7 Z" fill="currentColor" />
          <path d="M10 7 L10 20 L14 20 L14 7" />
          <path d="M7 20 L17 20" />
          <path d="M5 22 L19 22" />
          <path d="M9 11 L15 11" opacity="0.6" />
          <path d="M9 15 L15 15" opacity="0.6" />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-display text-[15px] font-semibold ${wordColor}`}>
          Lighthouse
        </span>
        <span
          className={`-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
            variant === "light" ? "text-clay-300" : "text-clay-500"
          }`}
        >
          Capital Partners
        </span>
      </div>
    </div>
  );
}
