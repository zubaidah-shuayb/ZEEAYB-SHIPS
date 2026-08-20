import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

export function TrackWidget({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const code = value.trim().toUpperCase();
        if (!code) return;
        navigate({ to: "/track", search: { q: code } });
      }}
      className="panel p-6 sm:p-7"
    >
      <h2 className="text-lg font-medium">Where's your shipment?</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter tracking number"
            className="w-full rounded-xl border border-input bg-white/4 py-3.5 pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-pink/50 focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="bg-brand rounded-xl px-5 py-3.5 text-sm font-medium text-[#0B0710] transition-transform hover:-translate-y-0.5"
        >
          Track package
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Example: <span className="text-lavender-soft">ZBY-2048-NG</span> ·{" "}
        <Link to="/ship" className="hover:text-foreground">
          Create a shipment
        </Link>
      </p>
    </form>
  );
}
