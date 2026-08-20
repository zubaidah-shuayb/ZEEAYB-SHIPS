import { STATUS_LABELS, type ShipmentStatus } from "@/lib/shipping";
import { cn } from "@/lib/utils";

const TONES: Record<ShipmentStatus, string> = {
  pending: "border-white/12 bg-white/5 text-muted-foreground",
  created: "border-lavender/30 bg-lavender/10 text-lavender-soft",
  picked_up: "border-lavender/30 bg-lavender/10 text-lavender-soft",
  in_transit: "border-pink/35 bg-pink/12 text-pink-soft",
  out_for_delivery: "border-pink/35 bg-pink/12 text-pink-soft",
  delivered: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ShipmentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide",
        TONES[status] ?? TONES.pending,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
