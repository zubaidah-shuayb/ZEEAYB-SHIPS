import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Radar, Boxes, ArrowRight } from "lucide-react";
import { TrackWidget } from "@/components/TrackWidget";
import { RouteViz } from "@/components/RouteViz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZEEAYB Ships — Shipping, reimagined." },
      {
        name: "description",
        content:
          "Simple shipping for people and businesses that move what matters. Create shipments and track every step in real time.",
      },
      { property: "og:title", content: "ZEEAYB Ships — Shipping, reimagined." },
      {
        property: "og:description",
        content: "Simple shipping for people and businesses that move what matters.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Fast by design",
    body: "Simple shipping without unnecessary complexity.",
  },
  {
    icon: Radar,
    title: "Real-time visibility",
    body: "Know where your package is at every step.",
  },
  {
    icon: Boxes,
    title: "Built for movement",
    body: "One simple platform for sending and tracking.",
  },
];

const STEPS = [
  { n: "01", title: "Create your shipment", body: "Enter sender, recipient, and package details." },
  { n: "02", title: "We move it", body: "Choose a shipping option and create the shipment." },
  { n: "03", title: "Track every step", body: "Follow your package from pickup to delivery." },
];

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="halo animate-drift pointer-events-none absolute inset-x-0 -top-40 h-[520px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-20 pb-8 lg:grid-cols-[1.05fr_1fr] lg:pt-28">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/4 px-3 py-1.5 text-xs tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-pink" />
              Move what matters.
            </span>
            <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Shipping, <span className="text-gradient">reimagined.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
              Simple shipping for people and businesses that move what matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/ship"
                className="bg-brand group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
              >
                Ship a package
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/track"
                search={{ q: "" }}
                className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm transition-colors hover:bg-white/6"
              >
                Track shipment
              </Link>
            </div>
          </div>

          <div className="panel animate-rise relative overflow-hidden p-4 sm:p-6">
            <RouteViz />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-5 pt-10 pb-24">
          <TrackWidget />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="panel group p-7 transition-all duration-300 hover:-translate-y-1 hover:border-pink/30"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/4 text-pink-soft transition-colors group-hover:border-pink/40">
                <f.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-background p-8 transition-colors hover:bg-white/3">
              <span className="text-xs tracking-[0.2em] text-pink-soft">{s.n}</span>
              <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="panel relative overflow-hidden px-8 py-16 text-center sm:px-16">
          <div className="halo pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Ready to move something?
            </h2>
            <p className="mt-4 text-muted-foreground">Create your first shipment in minutes.</p>
            <Link
              to="/ship"
              className="bg-brand mt-8 inline-flex rounded-full px-6 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
            >
              Create shipment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
