"use client";

export type ViewMode = "all-time" | "today";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const options: { mode: ViewMode; label: string }[] = [
    { mode: "all-time", label: "All-time" },
    { mode: "today", label: "Today" },
  ];

  return (
    <div className="inline-flex rounded-full bg-accent-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.mode}
          onClick={() => onChange(opt.mode)}
          className={`text-body rounded-full px-4 py-1.5 font-semibold transition-colors ${
            value === opt.mode
              ? "bg-accent-500 text-white"
              : "text-neutral-500"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
