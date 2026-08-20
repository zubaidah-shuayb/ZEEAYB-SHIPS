import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, PartyPopper } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { createShipment, type Shipment } from "@/services/shipments";
import {
  PACKAGE_TYPES,
  SHIPPING_METHODS,
  calculatePrice,
  estimatedDelivery,
  formatDate,
  formatMoney,
  generateTrackingNumber,
  type ShippingMethod,
} from "@/lib/shipping";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ship")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create a shipment — ZEEAYB Ships" },
      {
        name: "description",
        content: "Create a shipment in four simple steps: sender, recipient, package, shipping.",
      },
      { property: "og:title", content: "Create a shipment — ZEEAYB Ships" },
      { property: "og:description", content: "Create a shipment in four simple steps." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ShipPage />
    </RequireAuth>
  ),
});

const STEPS = ["Sender", "Recipient", "Package", "Shipping"] as const;

type Form = {
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city: string;
  sender_country: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  recipient_country: string;
  package_type: string;
  package_weight: string;
  package_length: string;
  package_width: string;
  package_height: string;
  shipping_method: ShippingMethod;
};

const EMPTY: Form = {
  sender_name: "",
  sender_phone: "",
  sender_address: "",
  sender_city: "",
  sender_country: "",
  recipient_name: "",
  recipient_phone: "",
  recipient_address: "",
  recipient_city: "",
  recipient_country: "",
  package_type: PACKAGE_TYPES[1],
  package_weight: "",
  package_length: "",
  package_width: "",
  package_height: "",
  shipping_method: "standard",
};

function ShipPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [created, setCreated] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(
    () => calculatePrice(parseFloat(form.package_weight), form.shipping_method),
    [form.package_weight, form.shipping_method],
  );
  const eta = useMemo(() => estimatedDelivery(form.shipping_method), [form.shipping_method]);

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () =>
      createShipment({
        tracking_number: generateTrackingNumber(),
        sender_name: form.sender_name,
        sender_phone: form.sender_phone,
        sender_address: form.sender_address,
        sender_city: form.sender_city,
        sender_country: form.sender_country,
        recipient_name: form.recipient_name,
        recipient_phone: form.recipient_phone,
        recipient_address: form.recipient_address,
        recipient_city: form.recipient_city,
        recipient_country: form.recipient_country,
        package_type: form.package_type,
        package_weight: parseFloat(form.package_weight) || 0,
        package_length: parseFloat(form.package_length) || null,
        package_width: parseFloat(form.package_width) || null,
        package_height: parseFloat(form.package_height) || null,
        shipping_method: form.shipping_method,
        price,
        estimated_delivery: eta.toISOString(),
      }),
    onSuccess: (shipment) => setCreated(shipment),
    onError: (err) =>
      setError(err instanceof Error ? err.message : "We couldn't create your shipment right now."),
  });

  if (created) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="panel animate-rise p-10">
          <span className="bg-brand mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl text-[#0B0710]">
            <PartyPopper className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Shipment created.</h1>
          <p className="mt-2 text-muted-foreground">Your package is ready to move.</p>
          <p className="mt-8 text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Tracking number
          </p>
          <p className="text-gradient mt-1 text-3xl font-semibold">{created.tracking_number}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/track"
              search={{ q: created.tracking_number }}
              className="bg-brand rounded-full px-5 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
            >
              Track shipment
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full border border-border px-5 py-3 text-sm transition-colors hover:bg-white/6"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canContinue = validate(step, form);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Create a shipment</h1>
      <p className="mt-3 text-muted-foreground">Four short steps. Then it moves.</p>

      <div className="mt-8 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => i < step && setStep(i)}
            className="text-left"
            type="button"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-brand" : "bg-white/8",
              )}
            />
            <p
              className={cn(
                "mt-2 text-[11px] tracking-wide",
                i <= step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              0{i + 1} {label}
            </p>
          </button>
        ))}
      </div>

      <div key={step} className="panel animate-rise mt-6 p-7">
        {step === 0 && (
          <Party
            title="Sender"
            prefix="sender"
            form={form}
            set={set}
          />
        )}
        {step === 1 && (
          <Party
            title="Recipient"
            prefix="recipient"
            form={form}
            set={set}
          />
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Package</h2>
            <label className="block">
              <span className="text-xs tracking-wide text-muted-foreground">Package type</span>
              <select
                value={form.package_type}
                onChange={(e) => set("package_type")(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-white/4 px-3.5 py-3 text-sm outline-none focus:border-pink/50 focus:ring-2 focus:ring-ring"
              >
                {PACKAGE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#120D17]">
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Weight (kg)" type="number" value={form.package_weight} onChange={set("package_weight")} />
              <Field label="Length (cm)" type="number" value={form.package_length} onChange={set("package_length")} />
              <Field label="Width (cm)" type="number" value={form.package_width} onChange={set("package_width")} />
              <Field label="Height (cm)" type="number" value={form.package_height} onChange={set("package_height")} />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-medium">Shipping</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SHIPPING_METHODS.map((m) => {
                const selected = form.shipping_method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set("shipping_method")(m.id)}
                    className={cn(
                      "rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5",
                      selected
                        ? "border-pink/50 bg-pink/8 shadow-[0_20px_60px_-30px_rgba(255,79,163,0.7)]"
                        : "border-border bg-white/3",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.name}</span>
                      {selected && <Check className="h-4 w-4 text-pink-soft" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.eta}</p>
                    <p className="mt-4 text-lg font-semibold">
                      {formatMoney(calculatePrice(parseFloat(form.package_weight), m.id))}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-white/3 p-5">
              <h3 className="text-sm font-medium">Review</h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Row label="Sender" value={`${form.sender_name} · ${form.sender_city}, ${form.sender_country}`} />
                <Row
                  label="Recipient"
                  value={`${form.recipient_name} · ${form.recipient_city}, ${form.recipient_country}`}
                />
                <Row
                  label="Package"
                  value={`${form.package_type} · ${form.package_weight || 0}kg`}
                />
                <Row
                  label="Shipping method"
                  value={SHIPPING_METHODS.find((m) => m.id === form.shipping_method)!.name}
                />
                <Row label="Estimated delivery" value={formatDate(eta)} />
                <Row label="Price" value={formatMoney(price)} />
              </dl>
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:bg-white/6 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
            className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5 disabled:opacity-40"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
            className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create shipment
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/dashboard" })}
        className="mt-6 text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel and return to dashboard
      </button>
    </div>
  );
}

function validate(step: number, form: Form) {
  if (step === 0)
    return Boolean(form.sender_name && form.sender_address && form.sender_city && form.sender_country);
  if (step === 1)
    return Boolean(
      form.recipient_name && form.recipient_address && form.recipient_city && form.recipient_country,
    );
  if (step === 2) return Boolean(form.package_type && parseFloat(form.package_weight) > 0);
  return true;
}

function Party({
  title,
  prefix,
  form,
  set,
}: {
  title: string;
  prefix: "sender" | "recipient";
  form: Form;
  set: (key: keyof Form) => (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" value={form[`${prefix}_name`]} onChange={set(`${prefix}_name`)} />
        <Field label="Phone" value={form[`${prefix}_phone`]} onChange={set(`${prefix}_phone`)} />
      </div>
      <Field label="Address" value={form[`${prefix}_address`]} onChange={set(`${prefix}_address`)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" value={form[`${prefix}_city`]} onChange={set(`${prefix}_city`)} />
        <Field label="Country" value={form[`${prefix}_country`]} onChange={set(`${prefix}_country`)} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-wide text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-white/4 px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-pink/50 focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
