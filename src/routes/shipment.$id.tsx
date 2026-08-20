import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { RouteViz } from "@/components/RouteViz";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyShipment, listShipmentEvents } from "@/services/shipments";
import { formatDate, formatMoney } from "@/lib/shipping";

export const Route = createFileRoute("/shipment/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shipment details — ZEEAYB Ships" },
      { name: "description", content: "Private shipment details, package information, and timeline." },
      { property: "og:title", content: "Shipment details — ZEEAYB Ships" },
      { property: "og:description", content: "Private shipment details and timeline." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ShipmentDetail />
    </RequireAuth>
  ),
});

function ShipmentDetail() {
  const { id } = Route.useParams();

  const shipmentQuery = useQuery({ queryKey: ["shipment", id], queryFn: () => getMyShipment(id) });
  const eventsQuery = useQuery({
    queryKey: ["shipment-events", id],
    queryFn: () => listShipmentEvents(id),
    enabled: Boolean(shipmentQuery.data),
  });

  if (shipmentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-5 py-16">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="h-40 w-full bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5" />
      </div>
    );
  }

  if (shipmentQuery.isError || !shipmentQuery.data) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24">
        <div className="panel p-10 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-medium">Shipment unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't load this shipment. It may not exist or may not belong to your account.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-full border border-border px-5 py-2.5 text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const s = shipmentQuery.data;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="animate-rise mt-6 space-y-6">
        <div className="panel p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                Tracking number
              </p>
              <h1 className="mt-1 text-3xl font-semibold">{s.tracking_number}</h1>
            </div>
            <StatusBadge status={s.status} />
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Origin" value={`${s.sender_city}, ${s.sender_country}`} />
            <Info label="Destination" value={`${s.recipient_city}, ${s.recipient_country}`} />
            <Info label="Shipping method" value={s.shipping_method} className="capitalize" />
            <Info label="Estimated delivery" value={formatDate(s.estimated_delivery)} />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border/70">
            <RouteViz compact className="h-32" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-7">
            <h2 className="text-lg font-medium">Package</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Type" value={s.package_type} />
              <Row label="Weight" value={`${s.package_weight} kg`} />
              <Row
                label="Dimensions"
                value={
                  s.package_length && s.package_width && s.package_height
                    ? `${s.package_length} × ${s.package_width} × ${s.package_height} cm`
                    : "—"
                }
              />
              <Row label="Price" value={formatMoney(s.price)} />
              <Row label="Created" value={formatDate(s.created_at)} />
            </dl>
          </div>

          <div className="panel p-7">
            <h2 className="text-lg font-medium">Timeline</h2>
            <div className="mt-6">
              {eventsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-white/5" />
                  ))}
                </div>
              ) : (
                <Timeline status={s.status} events={eventsQuery.data ?? []} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${className ?? ""}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
