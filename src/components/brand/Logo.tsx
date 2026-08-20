export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="zeeayb-mark" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#FF4FA3" />
          <stop offset="100%" stopColor="#A98BFF" />
        </linearGradient>
      </defs>
      <path
        d="M7 8h18L9 24h18"
        stroke="url(#zeeayb-mark)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="8" r="2.6" fill="#FF4FA3" />
      <circle cx="27" cy="24" r="2.6" fill="#A98BFF" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo className="h-7 w-7" />
      <span className="text-[15px] font-semibold tracking-[0.22em] text-foreground">ZEEAYB</span>
    </span>
  );
}
