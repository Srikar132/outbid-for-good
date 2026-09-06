import { Crown, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-4 py-4 sm:px-8">
      <div className="flex items-center gap-2">
        <Crown size={22} className="text-accent-500" fill="currentColor" />
        <span className="text-h3 text-neutral-900">OUTBID</span>
      </div>
      <div className="hidden items-center gap-6 sm:flex">
        <a href="#" className="text-body font-semibold text-primary-500">
          Leaderboard
        </a>
        <a href="#" className="text-body text-neutral-700">
          Our Cause
        </a>
      </div>
      <Button variant="primary" className="h-10 px-4 text-sm">
        Outbid Now
        <ArrowRight size={16} />
      </Button>
    </nav>
  );
}
