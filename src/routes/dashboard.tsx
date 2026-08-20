import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackagePlus, AlertTriangle } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyShipments, type Shipment } from "@/services/shipments";
import { formatDate, greeting } from "@/lib/shipping";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — ZEEAYB Ships" },
      { name: "description", content: "See everything that's moving: active, in transit, and delivered shipments." },
      { property: "og:title", content: "Dashboard — ZEEAYB Ships" },
      { property: "og:description", content: "See everything that's moving." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-shipments"],
    queryFn: listMyShipments,
  });

  const shipments = data ?? [];
  const stats = [
    {
      label: "Active shipments",
      value: shipments.filter((s) => !["delivered", "cancelled"].includes(s.status)).length,
    },
    { label: "In transit", value: shipments.filter((s) => s.status === "in_transit").length },
    { label: "Delivered", value: shipments.filter((s) => s.status === "delivered").length },
    { label: "Pending", value: shipments.filter((s) => s.status === "pending").length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{greeting()}</h1>
          <p className="mt-3 text-muted-foreground">Here's what's moving.</p>
        </div>
        <Link
          to="/ship"
          className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
        >
          <PackagePlus className="h-4 w-4" /> Create shipment
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-6 transition-transform hover:-translate-y-0.5">
            <p className="text-xs tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-3 text-3xl font-semibold">
              {isLoading ? <Skeleton className="h-8 w-12 bg-white/5" /> : s.value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-lg font-medium">Recent shipments</h2>

      {isLoading && (
        <div className="panel mt-4 space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      )}

      {isError && (
        <div className="panel mt-4 p-10 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't load your shipments right now.
          </p>
        </div>
      )}

      {!isLoading && !isError && shipments.length === 0 && (
        <div className="panel mt-4 p-12 text-center">
          <h3 className="text-lg font-medium">No shipments yet.</h3>
          <p className="mt-2 text-sm text-muted-foreground">Your next delivery starts here.</p>
          <Link
            to="/ship"
            className="bg-brand mt-6 inline-flex rounded-full px-5 py-3 text-sm font-medium text-[#0B0710]"
          >
            Create shipment
          </Link>
        </div>
      )}

      {shipments.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="panel mt-4 hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground">
                  <th className="px-6 py-4 font-normal">Tracking</th>
                  <th className="px-6 py-4 font-normal">Destination</th>
                  <th className="px-6 py-4 font-normal">Shipping method</th>
                  <th className="px-6 py-4 font-normal">Date</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/3">
                    <td className="px-6 py-4">
                      <Link to="/shipment/$id" params={{ id: s.id }} className="hover:text-pink-soft">
                        {s.tracking_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {s.recipient_city}, {s.recipient_country}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{s.shipping_method}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(s.created_at)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {shipments.map((s: Shipment) => (
              <Link
                key={s.id}
                to="/shipment/$id"
                params={{ id: s.id }}
                className="panel block p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.tracking_number}</span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.recipient_city}, {s.recipient_country}
                </p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">
                  {s.shipping_method} · {formatDate(s.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
