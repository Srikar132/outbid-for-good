import { BarChart3 } from "lucide-react";

export function ProgressBar({
  label = "Race to the Top",
  current,
  nextBid,
  percent,
}: {
  label?: string;
  current: string;
  nextBid: string;
  percent: number;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-body-lg text-neutral-900">{label}</p>
        <p className="text-small text-neutral-500">Current: {current}</p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-primary-400"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-small text-neutral-700">Next bid: {nextBid}</p>
        <p className="text-small text-neutral-500">Be the next to take #1</p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-primary-100 px-3 py-2">
        <BarChart3 size={16} className="shrink-0 text-primary-500" />
        <p className="text-small text-primary-500">
          To take the #1 position, your donation must be higher than the
          current top amount ({nextBid} or more).
        </p>
      </div>
    </div>
  );
}
