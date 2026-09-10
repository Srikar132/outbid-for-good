/**
 * Labelled rule between list sections ("TOP 20"). Always rendered between two
 * <ol> elements, never inside one — a <div> sibling of <li>s is invalid HTML.
 */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3 py-1">
      <span aria-hidden="true" className="h-px flex-1 bg-neutral-200 dark:bg-white/5" />
      <span className="text-small rounded-full bg-pill-bg px-3 py-1 font-semibold tracking-wide text-accent-500">
        {label}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-neutral-200 dark:bg-white/5" />
    </div>
  );
}
