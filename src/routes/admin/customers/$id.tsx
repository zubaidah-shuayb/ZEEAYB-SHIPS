import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/admin/ui";
import { getProfile, listAllShipments } from "@/services/admin";
import { formatDate } from "@/lib/shipping";

export const Route = createFileRoute("/admin/customers/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Customer — ZEEAYB Operations" },
      { name: "description", content: "Customer account overview and shipments." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const profileQ = useQuery({ queryKey: ["admin-profile-of", id], queryFn: () => getProfile(id) });
  const shipmentsQ = useQuery({ queryKey: ["admin-shipments"], queryFn: listAllShipments });

  const shipments = (shipmentsQ.data ?? []).filter((s) => s.user_id === id);

  if (profileQ.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-5 py-10 lg:px-8">
        <Skeleton className="h-6 w-28 bg-white/6" />
        <Skeleton className="h-12 w-64 bg-white/6" />
        <Skeleton className="h-40 bg-white/5" />
      </div>
    );
  }

  if (profileQ.isError) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <ErrorState
          title="Unable to load customer"
          body="We couldn't retrieve this customer right now."
        />
      </div>
    );
  }

  const profile = profileQ.data;
  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <EmptyState title="Customer not found" body="This account no longer exists." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-12">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Customers
      </Link>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
        {profile.full_name ?? "Unnamed account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Joined", value: formatDate(profile.created_at) },
          { label: "Role", value: profile.role === "admin" ? "Administrator" : "Customer" },
          { label: "Total shipments", value: String(shipments.length) },
          {
            label: "Active",
            value: String(
              shipments.filter((s) => !["delivered", "cancelled"].includes(s.status)).length,
            ),
          },
        ].map((f) => (
          <div key={f.label} className="panel p-5">
            <p className="text-[11px] tracking-wide text-muted-foreground">{f.label}</p>
            <p className="mt-2 text-lg font-medium">{f.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-medium">Shipments</h2>
      {shipmentsQ.isPending ? (
        <div className="panel mt-3 space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full bg-white/5" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No shipments" body="This customer hasn't shipped anything yet." />
        </div>
      ) : (
        <div className="panel mt-3 divide-y divide-border">
          {shipments.map((s) => (
            <Link
              key={s.id}
              to="/admin/shipments/$id"
              params={{ id: s.id }}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/[0.035]"
            >
              <div>
                <p className="font-mono text-[13px]">{s.tracking_number}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.sender_city} → {s.recipient_city} · {formatDate(s.created_at)}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
