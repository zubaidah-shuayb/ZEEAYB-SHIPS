import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/help")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Help — ZEEAYB Operations" },
      { name: "description", content: "How to run day-to-day ZEEAYB operations." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHelp,
});

const STEPS = [
  {
    title: "Start with the overview",
    body: "The dashboard shows what exists, what's moving and what needs attention first thing in the morning.",
  },
  {
    title: "Work the attention list",
    body: "Pending shipments, deliveries past their ETA and recent cancellations are surfaced automatically from live data.",
  },
  {
    title: "Update movement",
    body: "Open a shipment, choose Update shipment status, set the location and a short description. The customer's tracking page reflects it immediately.",
  },
  {
    title: "Keep the log clean",
    body: "Every update creates a movement event attributed to your account — that's the operational audit trail.",
  },
];

function AdminHelp() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader title="Help" subtitle="Running ZEEAYB operations day to day." />
      <div className="mt-8 space-y-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="panel animate-rise flex gap-4 p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="bg-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-[#0B0710]">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
