import Link from "next/link";
import { Scope, viewToggleHref } from "@/lib/scope";

export type ViewMode = "all-time" | "today";

export function ViewToggle({ scope, q }: { scope: Scope; q?: string }) {
  const value: ViewMode = scope.today ? "today" : "all-time";
  const options: { mode: ViewMode; label: string }[] = [
    { mode: "all-time", label: "All-time" },
    { mode: "today", label: "Today" },
  ];

  return (
    <div className="inline-flex rounded-full bg-accent-50 p-1">
      {options.map((opt) => (
        <Link
          key={opt.mode}
          href={viewToggleHref(opt.mode, scope, q)}
          className={`text-body rounded-full px-4 py-1.5 font-semibold transition-colors ${
            value === opt.mode ? "bg-accent-500 text-white" : "text-neutral-500"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
