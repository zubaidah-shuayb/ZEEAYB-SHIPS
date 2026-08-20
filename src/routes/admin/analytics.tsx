import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader } from "@/components/admin/ui";
import { listAllShipments } from "@/services/admin";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Analytics — ZEEAYB Operations" },
      { name: "description", content: "Movement trends across the ZEEAYB network." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAnalytics,
});

const TOOLTIP_STYLE = {
  background: "rgba(18,13,23,0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
};

function AdminAnalytics() {
  const shipmentsQ = useQuery({ queryKey: ["admin-shipments"], queryFn: listAllShipments });
  const shipments = shipmentsQ.data ?? [];

  const volume = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      days.push({
        day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: shipments.filter((s) => {
          const t = new Date(s.created_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        }).length,
      });
    }
    return days;
  }, [shipments]);

  const delivery = [
    { name: "Delivered", value: shipments.filter((s) => s.status === "delivered").length },
    {
      name: "Active",
      value: shipments.filter((s) => !["delivered", "cancelled"].includes(s.status)).length,
    },
    { name: "Cancelled", value: shipments.filter((s) => s.status === "cancelled").length },
  ].filter((d) => d.value > 0);

  const methods = [
    { name: "Standard", value: shipments.filter((s) => s.shipping_method === "standard").length },
    { name: "Express", value: shipments.filter((s) => s.shipping_method === "express").length },
  ].filter((d) => d.value > 0);

  const destinations = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shipments) map.set(s.recipient_city, (map.get(s.recipient_city) ?? 0) + 1);
    return [...map.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [shipments]);

  if (shipmentsQ.isPending) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-5 py-10 lg:px-8">
        <Skeleton className="h-12 w-64 bg-white/6" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (shipmentsQ.isError) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <ErrorState
          title="Unable to load analytics"
          body="We couldn't retrieve the shipment data right now."
        />
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
        <PageHeader title="Analytics" subtitle="Movement trends across the network." />
        <div className="mt-8">
          <EmptyState
            title="Not enough data yet"
            body="Create more shipments to see movement trends."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader title="Analytics" subtitle="Movement trends across the network." />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-sm font-medium">Shipment volume</h2>
          <p className="text-xs text-muted-foreground">Last 14 days</p>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#FF4FA3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-medium">Delivery status</h2>
          <p className="text-xs text-muted-foreground">Delivered vs active</p>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={delivery}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                >
                  {delivery.map((d) => (
                    <Cell
                      key={d.name}
                      fill={
                        d.name === "Delivered"
                          ? "#34D399"
                          : d.name === "Active"
                            ? "#FF4FA3"
                            : "#F87171"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {delivery.map((d) => (
              <span key={d.name}>
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-medium">Shipping methods</h2>
          <p className="text-xs text-muted-foreground">Standard vs express</p>
          <div className="mt-6 space-y-4">
            {methods.map((m) => {
              const pct = (m.value / shipments.length) * 100;
              return (
                <div key={m.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.name}</span>
                    <span className="tabular-nums">
                      {m.value} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: m.name === "Express" ? "#FF4FA3" : "#A98BFF",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-medium">Popular destinations</h2>
          <p className="text-xs text-muted-foreground">Top delivery cities</p>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinations} layout="vertical" margin={{ left: 12 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={96}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#A98BFF" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
