import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/skeleton";

function AuthCheckingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="panel w-full max-w-sm space-y-4 p-8">
        <Skeleton className="h-3 w-24 bg-white/6" />
        <Skeleton className="h-8 w-48 bg-white/6" />
        <Skeleton className="h-3 w-full bg-white/6" />
        <div className="flex items-center gap-2 pt-2 text-xs tracking-[0.18em] text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-pink" />
          Verifying clearance
        </div>
      </div>
    </div>
  );
}

/**
 * Blocks the entire /admin subtree. Nothing protected renders until the
 * profile role has been resolved, so admin data can never flash.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, failed } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin/login", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      const t = setTimeout(() => navigate({ to: "/dashboard", replace: true }), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user) return <AuthCheckingState />;

  if (!isAdmin || failed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="panel animate-rise max-w-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-pink/30 bg-pink/10">
            <ShieldAlert className="h-5 w-5 text-pink-soft" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Admin access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only authorized ZEEAYB administrators can access this area. Taking you back to your
            dashboard.
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard", replace: true })}
            className="bg-brand mt-6 rounded-full px-5 py-2.5 text-sm font-medium text-[#0B0710]"
          >
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
