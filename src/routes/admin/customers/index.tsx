import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader } from "@/components/admin/ui";
import { listAllShipments, listProfiles } from "@/services/admin";
import { formatDate } from "@/lib/shipping";

export const Route = createFileRoute("/admin/customers/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Customers — ZEEAYB Operations" },
      { name: "description", content: "Registered ZEEAYB accounts and their shipment volume." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const profilesQ = useQuery({ queryKey: ["admin-profiles"], queryFn: listProfiles });
  const shipmentsQ = useQuery({ queryKey: ["admin-shipments"], queryFn: listAllShipments });
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shipmentsQ.data ?? []) map.set(s.user_id, (map.get(s.user_id) ?? 0) + 1);
    return map;
  }, [shipmentsQ.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (profilesQ.data ?? []).filter(
      (p) =>
        !q ||
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q),
    );
  }, [profilesQ.data, query]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader title="Customers" subtitle="Everyone shipping with ZEEAYB." />

      <div className="relative mt-8">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-2xl border border-border bg-white/[0.03] py-3 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pink/45"
        />
      </div>

      {profilesQ.isError && (
        <div className="mt-6">
          <ErrorState
            title="Unable to load customers"
            body="We couldn't retrieve the customer data right now."
          />
        </div>
      )}

      {profilesQ.isPending ? (
        <div className="panel mt-6 space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No customers" body="No customers yet." />
        </div>
      ) : (
        <>
          <div className="panel mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Shipments</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-3.5">{p.full_name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3.5 tabular-nums">{counts.get(p.id) ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <RoleChip role={p.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/admin/customers/$id"
                        params={{ id: p.id }}
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

          <div className="mt-6 space-y-3 md:hidden">
            {rows.map((p) => (
              <Link
                key={p.id}
                to="/admin/customers/$id"
                params={{ id: p.id }}
                className="panel block p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{p.full_name ?? "—"}</span>
                  <RoleChip role={p.role} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {counts.get(p.id) ?? 0} shipments · joined {formatDate(p.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RoleChip({ role }: { role: string }) {
  const admin = role === "admin";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] ${
        admin
          ? "border-pink/35 bg-pink/12 text-pink-soft"
          : "border-white/12 bg-white/5 text-muted-foreground"
      }`}
    >
      {admin ? "Administrator" : "Customer"}
    </span>
  );
}
