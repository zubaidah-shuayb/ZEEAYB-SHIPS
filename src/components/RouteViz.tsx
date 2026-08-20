import { cn } from "@/lib/utils";

/** Abstract route visualization — animated path lines between location nodes. */
export function RouteViz({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 600 300"
      className={cn("w-full", className)}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="600" y2="300">
          <stop offset="0%" stopColor="#FF4FA3" />
          <stop offset="100%" stopColor="#A98BFF" />
        </linearGradient>
        <radialGradient id="nodeGlow">
          <stop offset="0%" stopColor="#FF8BC4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FF8BC4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!compact &&
        Array.from({ length: 7 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 44 + 16}
            x2="600"
            y2={i * 44 + 16}
            stroke="white"
            strokeOpacity="0.035"
          />
        ))}

      <path
        d="M60 230 C 170 230, 180 90, 300 90 S 450 200, 545 70"
        stroke="url(#routeGrad)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <path
        d="M60 230 C 170 230, 180 90, 300 90 S 450 200, 545 70"
        stroke="url(#routeGrad)"
        strokeWidth="2"
        strokeDasharray="10 14"
        className="animate-dash"
      />
      <path
        d="M60 230 C 200 260, 320 250, 420 180 S 520 120, 545 70"
        stroke="#C7B8FF"
        strokeOpacity="0.18"
        strokeWidth="1.2"
        strokeDasharray="4 10"
      />

      {[
        [60, 230],
        [300, 90],
        [420, 180],
        [545, 70],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="26" fill="url(#nodeGlow)" opacity={i % 2 ? 0.5 : 0.9} />
          <circle cx={x} cy={y} r="4.5" fill={i % 2 ? "#A98BFF" : "#FF4FA3"} />
          <circle cx={x} cy={y} r="10" stroke="white" strokeOpacity="0.16" />
        </g>
      ))}
    </svg>
  );
}
