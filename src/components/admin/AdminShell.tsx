import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  PackageSearch,
  Users,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

const GROUPS = [
  { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: LayoutGrid }] },
  {
    label: "Shipments",
    items: [{ to: "/admin/shipments", label: "All shipments", icon: PackageSearch }],
  },
  { label: "Customers", items: [{ to: "/admin/customers", label: "Customers", icon: Users }] },
  { label: "Analytics", items: [{ to: "/admin/analytics", label: "Analytics", icon: BarChart3 }] },
] as const;

const SECONDARY = [
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/help", label: "Help", icon: LifeBuoy },
] as const;

function NavContent({ pathname }: { pathname: string }) {
  return (
    <>
      {GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-3 pb-2 text-[10px] font-medium tracking-[0.2em] text-muted-foreground/70 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active =
              item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground",
                  active && "bg-white/[0.07] text-foreground shadow-[inset_2px_0_0_0_var(--pink)]",
                )}
              >
                <item.icon
                  className={cn("h-4 w-4 transition-colors", active && "text-pink-soft")}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="my-4 h-px bg-border" />

      {SECONDARY.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
            pathname === item.to && "bg-white/[0.07] text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const identity = (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold text-[#0B0710]">
          OP
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-foreground">{profile?.email}</p>
          <p className="text-[10px] tracking-[0.18em] text-lavender-soft uppercase">
            Administrator
          </p>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" /> Log out
      </button>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <Logo className="h-7 w-7" />
      <div className="leading-tight">
        <p className="text-[14px] font-semibold tracking-[0.22em]">ZEEAYB</p>
        <p className="text-[9px] tracking-[0.32em] text-pink-soft uppercase">Operations</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-[rgba(18,13,23,0.6)] backdrop-blur-xl lg:flex">
        {brand}
        <nav className="flex-1 overflow-y-auto px-3">
          <NavContent pathname={pathname} />
        </nav>
        {identity}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        {brand}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle operations navigation"
          className="rounded-xl border border-border p-2"
        >
          {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {open && (
        <div className="animate-rise fixed inset-x-0 top-[61px] bottom-0 z-40 overflow-y-auto border-t border-border bg-background/97 px-3 py-4 backdrop-blur-xl lg:hidden">
          <NavContent pathname={pathname} />
          {identity}
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
