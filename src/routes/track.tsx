import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { PackageX } from "lucide-react";
import { TrackWidget } from "@/components/TrackWidget";
import { Timeline } from "@/components/Timeline";
import { StatusBadge } from "@/components/StatusBadge";
import { RouteViz } from "@/components/RouteViz";
import { Skeleton } from "@/components/ui/skeleton";
import { trackByNumber } from "@/services/shipments";
import { formatDate } from "@/lib/shipping";

export const Route = createFileRoute("/track")({
  ssr: false,
  validateSearch: z.object({ q: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Track a shipment — ZEEAYB Ships" },
      {
        name: "description",
        content: "Enter your ZEEAYB tracking number to follow your package from pickup to delivery.",
      },
      { property: "og:title", content: "Track a shipment — ZEEAYB Ships" },
      { property: "og:description", content: "Follow your package from pickup to delivery." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { q } = Route.useSearch();
  const code = q.trim().toUpperCase();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tracking", code],
    queryFn: () => trackByNumber(code),
    enabled: code.length > 0,
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Track shipment</h1>
      <p className="mt-3 text-muted-foreground">Real-time visibility, from pickup to doorstep.</p>

      <div className="mt-8">
        <TrackWidget initial={code} />
      </div>

      {code && isLoading && (
        <div className="panel mt-8 space-y-4 p-7">
          <Skeleton className="h-6 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-40 w-full bg-white/5" />
        </div>
      )}

      {code && isError && (
        <EmptyBox
          title="Something went wrong"
          body="We couldn't reach tracking right now. Please try again in a moment."
        />
      )}

      {code && !isLoading && !isError && !data && (
        <EmptyBox
          title="Shipment not found"
          body="We couldn't find a shipment with that tracking number. Check the number and try again."
        />
      )}

      {data && (
        <div className="animate-rise mt-8 space-y-6">
          <div className="panel p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Tracking number
                </p>
                <p className="mt-1 text-2xl font-semibold">{data.tracking_number}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Origin" value={`${data.origin_city}, ${data.origin_country}`} />
              <Info
                label="Destination"
                value={`${data.destination_city}, ${data.destination_country}`}
              />
              <Info label="Shipping method" value={capitalize(data.shipping_method)} />
              <Info label="Estimated delivery" value={formatDate(data.estimated_delivery)} />
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border/70">
              <RouteViz compact className="h-32" />
            </div>
          </div>

          <div className="panel p-7">
            <h2 className="mb-6 text-lg font-medium">Tracking timeline</h2>
            <Timeline status={data.status} events={data.events} />
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function EmptyBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel animate-rise mt-8 p-10 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white/4 text-muted-foreground">
        <PackageX className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-lg font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
