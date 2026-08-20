import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { useAdmin } from "@/hooks/use-admin";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — ZEEAYB Operations" },
      { name: "description", content: "Operator account and console settings." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { profile } = useAdmin();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-12">
      <PageHeader title="Settings" subtitle="Your operator account and console preferences." />

      <section className="panel mt-8 p-6">
        <h2 className="text-sm font-medium">Operator account</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Name</p>
            <p className="mt-1 text-sm">{profile?.full_name ?? "ZEEAYB Operations"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Email</p>
            <p className="mt-1 text-sm">{profile?.email}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Role</p>
            <p className="mt-1 text-sm text-pink-soft">Administrator</p>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-lavender-soft" />
          <h2 className="text-sm font-medium">Security</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>· Passwords are managed entirely by Supabase Auth — never by this console.</li>
          <li>· Admin permissions are enforced by database policies, not by the interface.</li>
          <li>· Every status change is recorded as a movement event against your account.</li>
        </ul>
      </section>
    </div>
  );
}
