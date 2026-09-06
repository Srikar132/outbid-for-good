import { Crown } from "lucide-react";

type StatusKind = "confirmed" | "pending" | "failed" | "webhook" | "current";

const dotColor: Record<Exclude<StatusKind, "current">, string> = {
  confirmed: "bg-success",
  pending: "bg-warning",
  failed: "bg-error",
  webhook: "bg-info",
};

const labels: Record<StatusKind, string> = {
  confirmed: "Payment Confirmed",
  pending: "Payment Pending",
  failed: "Payment Failed",
  webhook: "Webhook Confirmed",
  current: "#1 Current",
};

const descriptions: Record<StatusKind, string> = {
  confirmed: "Donation received and verified via webhook.",
  pending: "Donation is being processed.",
  failed: "Payment was not successful.",
  webhook: "Leaderboard updated after successful webhook.",
  current: "This donor currently holds the top position.",
};

export function StatusRow({ kind }: { kind: StatusKind }) {
  return (
    <div className="flex items-start gap-3">
      {kind === "current" ? (
        <Crown size={16} className="mt-0.5 text-accent-500" fill="currentColor" />
      ) : (
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor[kind]}`} />
      )}
      <div>
        <p className="text-body font-semibold text-neutral-900">{labels[kind]}</p>
        <p className="text-small text-neutral-500">{descriptions[kind]}</p>
      </div>
    </div>
  );
}
