import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  STATUS_COLORS,
  UPDATABLE_STATUSES,
  relativeTime,
  statusLabel,
} from "@/components/admin/ui";
import {
  getAdminShipment,
  getProfile,
  listAdminShipmentEvents,
  updateShipmentStatus,
} from "@/services/admin";
import { formatDate, formatMoney, formatTime, type ShipmentStatus } from "@/lib/shipping";

export const Route = createFileRoute("/admin/shipments/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shipment control — ZEEAYB Operations" },
      { name: "description", content: "Control the movement of a ZEEAYB shipment." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminShipmentDetail,
});

function AdminShipmentDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);

  const shipmentQ = useQuery({
    queryKey: ["admin-shipment", id],
    queryFn: () => getAdminShipment(id),
  });
  const eventsQ = useQuery({
    queryKey: ["admin-shipment-events", id],
    queryFn: () => listAdminShipmentEvents(id),
  });
  const shipment = shipmentQ.data ?? null;
  const customerQ = useQuery({
    queryKey: ["admin-profile-of", shipment?.user_id],
    queryFn: () => getProfile(shipment!.user_id),
    enabled: !!shipment?.user_id,
  });

  if (shipmentQ.isPending) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-5 py-10 lg:px-8">
        <Skeleton className="h-6 w-32 bg-white/6" />
        <Skeleton className="h-12 w-72 bg-white/6" />
        <div className="grid gap-4 pt-4 lg:grid-cols-3">
          <Skeleton className="h-64 bg-white/5 lg:col-span-2" />
          <Skeleton className="h-64 bg-white/5" />
        </div>
      </div>
    );
  }

  if (shipmentQ.isError) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <ErrorState
          title="Unable to load shipment"
          body="We couldn't retrieve this shipment right now."
        />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <EmptyState title="Shipment not found" body="This shipment no longer exists." />
      </div>
    );
  }

  const events = eventsQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
      <Link
        to="/admin/shipments"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All shipments
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
            {shipment.tracking_number}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={shipment.status} />
            <span className="text-xs text-muted-foreground">
              Updated {relativeTime(shipment.updated_at)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
        >
          <PenLine className="h-4 w-4" /> Update shipment status
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="panel p-6">
            <h2 className="text-sm font-medium">Route</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label="Origin" value={`${shipment.sender_city}, ${shipment.sender_country}`} />
              <Field
                label="Destination"
                value={`${shipment.recipient_city}, ${shipment.recipient_country}`}
              />
              <Field label="Shipping method" value={shipment.shipping_method} className="capitalize" />
              <Field label="Estimated delivery" value={formatDate(shipment.estimated_delivery)} />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-sm font-medium">Package</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Type" value={shipment.package_type} />
              <Field label="Weight" value={`${shipment.package_weight} kg`} />
              <Field
                label="Dimensions"
                value={
                  shipment.package_length
                    ? `${shipment.package_length} × ${shipment.package_width} × ${shipment.package_height} cm`
                    : "—"
                }
              />
              <Field label="Price" value={formatMoney(shipment.price)} />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-sm font-medium">Movement history</h2>
            <div className="mt-6">
              <Timeline status={shipment.status} events={events} />
            </div>

            {events.length > 0 && (
              <div className="mt-8 border-t border-border pt-5">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Full event log
                </p>
                <ul className="mt-3 space-y-2">
                  {[...events].reverse().map((e) => (
                    <li key={e.id} className="flex items-start gap-3 text-xs">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: STATUS_COLORS[e.status] }}
                      />
                      <span className="flex-1">
                        <span className="text-foreground">{statusLabel(e.status)}</span>{" "}
                        <span className="text-muted-foreground">
                          · {e.location ?? "—"} · {formatDate(e.created_at)} ·{" "}
                          {formatTime(e.created_at)}
                        </span>
                        {e.description && (
                          <span className="block text-muted-foreground">{e.description}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-sm font-medium">Customer</h2>
            <div className="mt-4 space-y-4">
              <Field label="Account" value={customerQ.data?.full_name ?? "—"} />
              <Field label="Email" value={customerQ.data?.email ?? "—"} />
              <Field label="Sender" value={shipment.sender_name} />
              <Field label="Recipient" value={shipment.recipient_name} />
            </div>
            {customerQ.data && (
              <Link
                to="/admin/customers/$id"
                params={{ id: customerQ.data.id }}
                className="mt-5 inline-block rounded-full border border-border px-3.5 py-2 text-xs transition-colors hover:bg-white/6"
              >
                View customer
              </Link>
            )}
          </section>

          <section className="panel p-6">
            <h2 className="text-sm font-medium">Created</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatDate(shipment.created_at)} · {formatTime(shipment.created_at)}
            </p>
          </section>
        </aside>
      </div>

      {panelOpen && (
        <UpdatePanel
          shipmentId={shipment.id}
          currentStatus={shipment.status}
          defaultLocation={`${shipment.recipient_city}, ${shipment.recipient_country}`}
          onClose={() => setPanelOpen(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-shipment", id] });
            queryClient.invalidateQueries({ queryKey: ["admin-shipment-events", id] });
            queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
            queryClient.invalidateQueries({ queryKey: ["my-shipments"] });
            router.invalidate();
            setPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${className}`}>{value}</p>
    </div>
  );
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function UpdatePanel({
  shipmentId,
  currentStatus,
  defaultLocation,
  onClose,
  onDone,
}: {
  shipmentId: string;
  currentStatus: ShipmentStatus;
  defaultLocation: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<ShipmentStatus>(currentStatus);
  const [location, setLocation] = useState(defaultLocation);
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(toLocalInput(new Date()));

  const mutation = useMutation({
    mutationFn: () =>
      updateShipmentStatus({
        shipmentId,
        status,
        location,
        description,
        occurredAt: new Date(occurredAt),
      }),
    onSuccess: () => {
      toast.success("Shipment updated", { description: `Status set to ${statusLabel(status)}.` });
      onDone();
    },
    onError: (err) => {
      toast.error("Unable to update shipment", {
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong while updating this shipment. Please try again.",
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="animate-rise relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-[rgba(18,13,23,0.96)] p-6 sm:p-8">
        <p className="text-[10px] tracking-[0.3em] text-pink-soft uppercase">Movement event</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Update shipment status</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This immediately updates the customer's tracking experience.
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="ev-status">
              Status
            </label>
            <select
              id="ev-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-pink/45"
            >
              {UPDATABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground" htmlFor="ev-location">
              Location
            </label>
            <input
              id="ev-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos Distribution Center"
              className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-pink/45"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground" htmlFor="ev-desc">
              Description
            </label>
            <textarea
              id="ev-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Package has departed the distribution center."
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-pink/45"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground" htmlFor="ev-time">
              Timestamp
            </label>
            <input
              id="ev-time"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-pink/45"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand flex flex-[1.4] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[#0B0710] disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
