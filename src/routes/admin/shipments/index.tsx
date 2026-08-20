import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_STATUSES, EmptyState, ErrorState, PageHeader, statusLabel } from "@/components/admin/ui";
import { listAllShipments, listProfiles } from "@/services/admin";
import { formatDate, type ShipmentStatus } from "@/lib/shipping";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/shipments/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shipments — ZEEAYB Operations" },
      { name: "description", content: "Manage every shipment moving through ZEEAYB." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminShipments,
});

type SortKey = "newest" | "oldest" | "status";

function AdminShipments() {
  const shipmentsQ = useQuery({ queryKey: ["admin-shipments"], queryFn: listAllShipments });
  const profilesQ = useQuery({ queryKey: ["admin-profiles"], queryFn: listProfiles });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const nameById = useMemo(
    () => new Map((profilesQ.data ?? []).map((p) => [p.id, p.full_name || p.email || "—"])),
    [profilesQ.data],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (shipmentsQ.data ?? []).filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      return (
        s.tracking_number.toLowerCase().includes(q) ||
        (nameById.get(s.user_id) ?? "").toLowerCase().includes(q) ||
        s.recipient_city.toLowerCase().includes(q) ||
        s.recipient_country.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "status") return a.status.localeCompare(b.status);
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
    return list;
  }, [shipmentsQ.data, query, status, sort, nameById]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader
        title="All shipments"
        subtitle="Search, filter and open any shipment to control its movement."
        right={
          <span className="rounded-full border border-border px-3.5 py-2 text-xs text-muted-foreground">
            {rows.length} shown
          </span>
        }
      />

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracking number, customer or destination…"
            className="w-full rounded-2xl border border-border bg-white/[0.03] py-3 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pink/45"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-2xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-pink/45"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", ...ADMIN_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s as ShipmentStatus | "all")}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground",
              status === s && "border-pink/40 bg-pink/12 text-pink-soft",
            )}
          >
            {s === "all" ? "All" : statusLabel(s as ShipmentStatus)}
          </button>
        ))}
      </div>

      {shipmentsQ.isError && (
        <div className="mt-6">
          <ErrorState
            title="Unable to load shipments"
            body="We couldn't retrieve the shipment data right now."
          />
        </div>
      )}

      {shipmentsQ.isPending ? (
        <div className="panel mt-6 space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No shipments"
            body={
              query || status !== "all"
                ? "No shipments match these filters."
                : "No shipments have been created yet."
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="panel mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
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
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px]">{s.tracking_number}</td>
                    <td className="px-5 py-3.5">{nameById.get(s.user_id) ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {s.sender_city}, {s.sender_country}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {s.recipient_city}, {s.recipient_country}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">
                      {s.shipping_method}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/admin/shipments/$id"
                        params={{ id: s.id }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-white/6"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {rows.map((s, i) => (
              <Link
                key={s.id}
                to="/admin/shipments/$id"
                params={{ id: s.id }}
                className="panel animate-rise block p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[13px]">{s.tracking_number}</span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 text-sm">{nameById.get(s.user_id) ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.sender_city} → {s.recipient_city} · {s.shipping_method}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(s.created_at)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
