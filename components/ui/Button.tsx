import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "text";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold text-sm transition-colors disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "h-12 px-4 rounded-md bg-accent-500 text-white hover:bg-accent-400 disabled:bg-accent-200",
  secondary:
    "h-12 px-4 rounded-md bg-primary-100 text-primary-500 hover:bg-primary-200 disabled:bg-neutral-100 disabled:text-neutral-300",
  tertiary:
    "h-12 px-4 text-primary-500 hover:text-primary-400 disabled:text-neutral-300",
  text: "text-accent-500 hover:text-accent-400 disabled:text-neutral-300 text-sm font-semibold",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
