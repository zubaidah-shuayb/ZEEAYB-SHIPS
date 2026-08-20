import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/brand/Logo";
import { useAdmin } from "@/hooks/use-admin";
import { ADMIN_EMAIL, getMyProfile } from "@/services/admin";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Operations sign in — ZEEAYB" },
      { name: "description", content: "ZEEAYB internal operations console." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

const RESTRICTED = "Only authorized ZEEAYB administrators can access this area.";

function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // An already-authenticated admin never sees this page.
  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin", replace: true });
  }, [loading, user, isAdmin, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError(RESTRICTED);
      return;
    }

    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError("That email or password doesn't look right.");
        return;
      }

      // Authorization comes from the database role, not the email check above.
      const profile = await getMyProfile();
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError(RESTRICTED);
        return;
      }

      navigate({ to: "/admin", replace: true });
    } catch {
      setError("We couldn't sign you in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <RouteGrid />

      <div className="panel animate-rise relative z-10 w-full max-w-md p-8 sm:p-10">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-[0.22em]">ZEEAYB</p>
            <p className="text-[9px] tracking-[0.34em] text-pink-soft uppercase">Operations</p>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Welcome back, operator.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage shipments and monitor movement.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs text-muted-foreground">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none transition-colors focus:border-pink/50"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="text-xs text-muted-foreground">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm outline-none transition-colors focus:border-pink/50"
            />
          </div>

          {error && (
            <div className="animate-rise rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive">
                {error === RESTRICTED ? "Admin access restricted" : "Sign in failed"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enter Operations
          </button>
        </form>

        <div className="mt-7 flex items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-lavender-soft" />
          Access is restricted to authorized ZEEAYB staff accounts.
        </div>

        <Link
          to="/"
          className="mt-3 inline-block text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to zeeayb.com
        </Link>
      </div>
    </div>
  );
}

function RouteGrid() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
      preserveAspectRatio="none"
      viewBox="0 0 800 600"
    >
      <defs>
        <linearGradient id="op-line" x1="0" y1="0" x2="800" y2="600">
          <stop offset="0%" stopColor="#FF4FA3" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#A98BFF" stopOpacity="0.5" />
        </linearGradient>
        <pattern id="op-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#op-grid)" />
      <path
        d="M-20 460 C 180 460, 220 200, 400 200 S 640 120, 820 120"
        fill="none"
        stroke="url(#op-line)"
        strokeWidth="1.6"
        strokeDasharray="10 12"
        className="animate-dash"
      />
      <circle cx="400" cy="200" r="4" fill="#FF4FA3" />
      <circle cx="120" cy="418" r="3" fill="#A98BFF" />
    </svg>
  );
}
