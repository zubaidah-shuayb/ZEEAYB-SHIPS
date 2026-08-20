import { STATUS_LABELS, type ShipmentStatus } from "@/lib/shipping";

export const ADMIN_STATUSES: ShipmentStatus[] = [
  "pending",
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

/** Statuses an operator may set from the console. */
export const UPDATABLE_STATUSES: ShipmentStatus[] = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "#8B8095",
  created: "#C7B8FF",
  picked_up: "#A98BFF",
  in_transit: "#FF8BC4",
  out_for_delivery: "#FF4FA3",
  delivered: "#34D399",
  cancelled: "#F87171",
};

export function statusLabel(status: ShipmentStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel animate-rise flex flex-col items-center px-6 py-16 text-center">
      <div className="halo mb-5 h-12 w-12 rounded-2xl opacity-70" />
      <p className="text-base font-medium">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel border-destructive/30 p-6">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
