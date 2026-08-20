import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowUpRight, Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_STATUSES,
  EmptyState,
  ErrorState,
  PageHeader,
  STATUS_COLORS,
  relativeTime,
  statusLabel,
} from "@/components/admin/ui";
import { listAllShipments, listProfiles, listRecentEvents } from "@/services/admin";
import { formatDate } from "@/lib/shipping";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Operations overview — ZEEAYB" },
      { name: "description", content: "Monitor everything moving through ZEEAYB." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const shipmentsQ = useQuery({ queryKey: ["admin-shipments"], queryFn: listAllShipments });
  const profilesQ = useQuery({ queryKey: ["admin-profiles"], queryFn: listProfiles });
  const eventsQ = useQuery({ queryKey: ["admin-events"], queryFn: () => listRecentEvents(10) });
  const [query, setQuery] = useState("");

  const shipments = shipmentsQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const nameById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.full_name || p.email || "—"])),
    [profiles],
  );

  const count = (s: string) => shipments.filter((x) => x.status === s).length;
  const stats = [
    { label: "Total shipments", value: shipments.length, tone: "text-foreground" },
    { label: "In transit", value: count("in_transit"), tone: "text-pink-soft" },
    { label: "Out for delivery", value: count("out_for_delivery"), tone: "text-pink-soft" },
    { label: "Delivered", value: count("delivered"), tone: "text-emerald-300" },
    { label: "Pending", value: count("pending"), tone: "text-lavender-soft" },
    {
      label: "Customers",
      value: profiles.filter((p) => p.role === "customer").length,
      tone: "text-foreground",
    },
  ];

  const loading = shipmentsQ.isPending || profilesQ.isPending;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return shipments
      .filter(
        (s) =>
          s.tracking_number.toLowerCase().includes(q) ||
          s.recipient_city.toLowerCase().includes(q) ||
          (nameById.get(s.user_id) ?? "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [query, shipments, nameById]);

  const now = Date.now();
  const attention = [
    {
      label: "Pending shipments awaiting processing",
      items: shipments.filter((s) => s.status === "pending"),
    },
    {
      label: "Past estimated delivery, still moving",
      items: shipments.filter(
        (s) =>
          s.estimated_delivery &&
          new Date(s.estimated_delivery).getTime() < now &&
          !["delivered", "cancelled"].includes(s.status),
      ),
    },
    {
      label: "Recently cancelled",
      items: shipments.filter(
        (s) =>
          s.status === "cancelled" &&
          now - new Date(s.updated_at).getTime() < 1000 * 60 * 60 * 24 * 7,
      ),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader
        title="Operations overview"
        subtitle="Monitor everything moving through ZEEAYB."
        right={
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-2 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            System operational
          </div>
        }
      />

      {/* Global search */}
      <div className="relative mt-8">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a tracking number, customer or destination…"
          className="w-full rounded-2xl border border-border bg-white/[0.03] py-3.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pink/45"
        />
        {query.trim() && (
          <div className="panel animate-rise absolute inset-x-0 top-full z-30 mt-2 overflow-hidden p-1.5">
            {searchResults.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No matching shipments.</p>
            ) : (
              searchResults.map((s) => (
                <Link
                  key={s.id}
                  to="/admin/shipments/$id"
                  params={{ id: s.id }}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{s.tracking_number}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {nameById.get(s.user_id) ?? "—"} · {s.recipient_city}, {s.recipient_country}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {shipmentsQ.isError && (
        <div className="mt-6">
          <ErrorState
            title="Unable to load shipments"
            body="We couldn't retrieve the shipment data right now."
          />
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="panel animate-rise p-5 transition-transform hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <p className="text-[11px] tracking-wide text-muted-foreground">{s.label}</p>
            {loading ? (
              <Skeleton className="mt-3 h-8 w-12 bg-white/6" />
            ) : (
              <p className={`mt-3 text-3xl font-semibold ${s.tone}`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Movement activity */}
        <section className="panel p-6 xl:col-span-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-pink-soft" />
            <h2 className="text-sm font-medium">Movement activity</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">Live feed</span>
          </div>

          <div className="mt-5 space-y-1">
            {eventsQ.isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-white/5" />
              ))}

            {eventsQ.isError && (
              <p className="text-sm text-muted-foreground">
                We couldn't load the movement feed right now.
              </p>
            )}

            {eventsQ.data?.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">No movement recorded yet.</p>
            )}

            {eventsQ.data?.map((e, i) => (
              <div
                key={e.id}
                className="animate-rise flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: STATUS_COLORS[e.status] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px]">{e.shipments?.tracking_number ?? "—"}</p>
                  <p className="text-sm text-foreground/90">{statusLabel(e.status)}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.location ?? "—"}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {relativeTime(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Status breakdown + attention */}
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-sm font-medium">Status breakdown</h2>
            <div className="mt-5 space-y-3">
              {ADMIN_STATUSES.map((s) => {
                const value = count(s);
                const pct = shipments.length ? (value / shipments.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{statusLabel(s)}</span>
                      <span className="tabular-nums">{value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: STATUS_COLORS[s] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-pink-soft" />
              <h2 className="text-sm font-medium">Needs attention</h2>
            </div>
            {attention.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nothing needs attention. Everything is moving.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {attention.map((g) => (
                  <li key={g.label} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{g.label}</p>
                      <span className="rounded-full bg-pink/12 px-2 py-0.5 text-xs text-pink-soft">
                        {g.items.length}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.items.slice(0, 4).map((s) => (
                        <Link
                          key={s.id}
                          to="/admin/shipments/$id"
                          params={{ id: s.id }}
                          className="rounded-lg border border-border px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/5"
                        >
                          {s.tracking_number}
                        </Link>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Recent shipments */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent shipments</h2>
          <Link
            to="/admin/shipments"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            All shipments <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="panel mt-3 space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full bg-white/5" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No shipments" body="No shipments have been created yet." />
          </div>
        ) : (
          <div className="panel mt-3 overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-medium">Tracking</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Origin</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 8).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px]">{s.tracking_number}</td>
                    <td className="px-5 py-3.5">{nameById.get(s.user_id) ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{s.sender_city}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{s.recipient_city}</td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">
                      {s.shipping_method}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {formatDate(s.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/admin/shipments/$id"
                        params={{ id: s.id }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-white/6"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
