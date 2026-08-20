import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/brand/Logo";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — ZEEAYB Ships" },
      { name: "description", content: "Sign in to ZEEAYB Ships to create and track shipments." },
      { property: "og:title", content: "Sign in — ZEEAYB Ships" },
      { property: "og:description", content: "Access your ZEEAYB shipping dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignUp) await signUp(fullName, email, password);
      else await signIn(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="panel animate-rise p-8">
        <Logo className="h-9 w-9" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {isSignUp ? "Create your account." : "Welcome back."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? "Start moving what matters." : "Sign in to keep things moving."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {isSignUp && (
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Ada Obi"
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-brand flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "New to ZEEAYB?"}{" "}
          <Link
            to="/auth"
            search={{ mode: isSignUp ? "signin" : "signup" }}
            className="text-pink-soft hover:underline"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-wide text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-white/4 px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-pink/50 focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
