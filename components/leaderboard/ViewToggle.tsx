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
    <div className="inline-flex items-center rounded-full bg-pill-bg p-1">
      {options.map((opt) => {
        const isSelected = value === opt.mode;
        return (
          <Link
            key={opt.mode}
            href={viewToggleHref(opt.mode, scope, q)}
            className={`text-body flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold transition-colors ${
              isSelected
                ? "bg-accent-500 text-white shadow-sm"
                : "text-neutral-700 hover:text-accent-500"
            }`}
          >
            {opt.mode === "today" && (
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelected ? "bg-white" : "bg-accent-500"
                }`}
              />
            )}
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
