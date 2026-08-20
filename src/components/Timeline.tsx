import { Check, Circle, Dot } from "lucide-react";
import { STATUS_LABELS, TIMELINE_STEPS, formatDate, formatTime, type ShipmentStatus } from "@/lib/shipping";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  description: string | null;
  created_at: string;
};

export function Timeline({ status, events }: { status: ShipmentStatus; events: Event[] }) {
  const currentIndex = TIMELINE_STEPS.indexOf(status);
  const eventByStatus = new Map(events.map((e) => [e.status, e]));

  return (
    <ol className="relative space-y-6">
      <span className="absolute top-2 bottom-2 left-[11px] w-px bg-border" aria-hidden="true" />
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentIndex > i;
        const active = currentIndex === i;
        const event = eventByStatus.get(step);
        return (
          <li
            key={step}
            className="animate-rise relative flex gap-4 pl-0"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                done && "border-lavender/50 bg-lavender/20 text-lavender-soft",
                active && "animate-pulse-glow border-pink/60 bg-pink/25 text-pink-soft",
                !done && !active && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : active ? (
                <Dot className="h-5 w-5" />
              ) : (
                <Circle className="h-2 w-2" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {STATUS_LABELS[step]}
              </p>
              {event ? (
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {event.description && <p>{event.description}</p>}
                  <p>
                    {event.location ?? "—"} · {formatDate(event.created_at)} ·{" "}
                    {formatTime(event.created_at)}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground/70">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
