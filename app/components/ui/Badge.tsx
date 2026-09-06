import { Crown, Check } from "lucide-react";
import { ReactNode } from "react";

type BadgeVariant =
  | "current"
  | "confirmed"
  | "pending"
  | "failed"
  | "donor"
  | "company";

const styles: Record<BadgeVariant, string> = {
  current: "bg-accent-500 text-white",
  confirmed: "bg-primary-100 text-primary-500",
  pending: "bg-accent-100 text-accent-500",
  failed: "bg-error/10 text-error",
  donor: "border border-neutral-200 text-neutral-700",
  company: "bg-info/10 text-info",
};

const icons: Partial<Record<BadgeVariant, ReactNode>> = {
  current: <Crown size={12} fill="currentColor" />,
  confirmed: <Check size={12} />,
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[variant]}`}
    >
      {icons[variant]}
      {children}
    </span>
  );
}
