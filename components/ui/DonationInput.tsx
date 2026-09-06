import { CheckCircle2, AlertCircle, Lock } from "lucide-react";

type State = "default" | "success" | "error";

const borderByState: Record<State, string> = {
  default: "border-neutral-200 focus:border-primary-400",
  success: "border-primary-400",
  error: "border-error",
};

export function DonationInput({
  label = "Your Donation Amount",
  value,
  state = "default",
  helperText,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  state?: State;
  helperText?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="text-small mb-1.5 block font-semibold text-neutral-700">
          {label}
        </label>
      )}
      <div
        className={`flex h-12 items-center gap-1 rounded-md border bg-surface px-3 ${borderByState[state]}`}
      >
        <span className="text-body-lg text-neutral-500">₹</span>
        <input
          className="text-body-lg w-full text-neutral-900 outline-none"
          value={value}
          placeholder={placeholder}
          readOnly={!onChange}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
        {state === "success" && (
          <CheckCircle2 size={18} className="shrink-0 text-primary-400" />
        )}
        {state === "error" && (
          <AlertCircle size={18} className="shrink-0 text-error" />
        )}
      </div>
      {helperText && (
        <p
          className={`text-small mt-1 ${
            state === "error" ? "text-error" : state === "success" ? "text-primary-500" : "text-neutral-500"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export function SecurePaymentInput() {
  return (
    <div>
      <label className="text-small mb-1.5 block font-semibold text-neutral-700">
        Payment Details (Secure)
      </label>
      <div className="flex h-12 items-center gap-2 rounded-md border border-neutral-200 bg-surface px-3">
        <span className="text-body-lg flex-1 text-neutral-900">
          Card Number 1234 5678 9012 3456
        </span>
        <Lock size={16} className="shrink-0 text-neutral-500" />
      </div>
    </div>
  );
}
