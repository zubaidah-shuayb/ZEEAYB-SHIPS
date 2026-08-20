import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Move what matters.</p>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Product</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/track" className="text-muted-foreground hover:text-foreground">
                Track Shipment
              </Link>
            </li>
            <li>
              <Link to="/ship" className="text-muted-foreground hover:text-foreground">
                Create Shipment
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Social</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>Instagram</li>
            <li>X</li>
            <li>LinkedIn</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-5 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ZEEAYB Ships. All rights reserved.
      </div>
    </footer>
  );
}
