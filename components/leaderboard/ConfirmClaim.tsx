"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Clock, Lock, XCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import posthog from "posthog-js";
import { Scope } from "@/lib/scope";
import { faviconUrlFor, parseIdentity } from "@/lib/identity";
import { z } from "zod";
import { claimFieldsSchema, MAX_TAGLINE_LENGTH, MAX_LOGO_BYTES } from "@/lib/validation/claim";
import { createClaim, ClaimError, ClaimState } from "@/app/donate/actions";

type PaymentPhase = "idle" | "submitted" | "cancelled" | "failed";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const inputClass =
  "text-body mt-1 block h-11 w-full rounded-md border border-neutral-200 bg-surface px-3 outline-none focus:border-primary-400";
const labelClass = "text-small font-semibold text-neutral-700";

const initialClaimState: ClaimState = { status: "idle" };

function claimErrorMessage(error: ClaimError): string {
  switch (error.code) {
    case "VALIDATION":
      return "Check the highlighted fields.";
    case "RATE_LIMITED":
      return "Too many attempts. Wait a minute and try again.";
    case "MODERATION_REJECTED":
      return error.reason;
    case "NO_ACTIVE_CYCLE":
      return "No active donation cycle right now.";
    case "CATEGORY_NOT_FOUND":
      return "That category no longer exists.";
    case "OUTBID":
      return `Someone else has claimed this. The current floor is ₹${error.floor.toLocaleString("en-IN")}.`;
    case "UPLOAD_FAILED":
      return "Couldn't upload logo. Try again.";
    case "ENTRY_CREATE_FAILED":
      return "Couldn't save your claim. Try again.";
    case "ORDER_CREATE_FAILED":
      return "Couldn't start checkout. Try again.";
    case "SERVER_MISCONFIGURED":
      return "Something's misconfigured on our end. Try again shortly.";
  }
}

export function ConfirmClaim({
  scope,
  amount,
  categorySlug,
  categoryTitle,
  initialUrl,
  fundMessage,
}: {
  scope: Scope;
  amount: number;
  categorySlug: string;
  categoryTitle: string;
  initialUrl: string;
  fundMessage?: string;
}) {
  const boundCreateClaim = createClaim.bind(
    null,
    amount,
    categorySlug,
    scope.categorySlug ?? null,
    !!scope.today
  );
  const [state, formAction, pending] = useActionState(boundCreateClaim, initialClaimState);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState(initialUrl);
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("idle");
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const openedOrderIdRef = useRef<string | null>(null);

  // The label describes the board being beaten (`scope`), not the entry's
  // own category tag — those can differ (e.g. claiming from "/" tagged as
  // Brand still only has to beat the global top). They coincide whenever
  // scope.categorySlug is set, since ClaimBand locks the tag to match then.
  const label = scope.categorySlug
    ? scope.today
      ? ` in ${categoryTitle} today`
      : ` in ${categoryTitle}`
    : scope.today
    ? " today"
    : "";

  const clientValidation = claimFieldsSchema.safeParse({
    displayName: name,
    companyName: company,
    url,
    tagline,
  });
  const clientFieldErrors = clientValidation.success
    ? {}
    : z.flattenError(clientValidation.error).fieldErrors;

  const serverFieldErrors =
    state.status === "error" && state.error.code === "VALIDATION"
      ? state.error.fieldErrors
      : undefined;

  const urlError = url.trim().length > 0 ? serverFieldErrors?.url ?? clientFieldErrors.url : undefined;
  const taglineError = serverFieldErrors?.tagline ?? clientFieldErrors.tagline;

  const identity = parseIdentity(url.trim());
  const canSubmit = agreed && clientValidation.success && !logoError && !pending;

  const avatarSrc = logoPreview ?? (identity ? faviconUrlFor(identity.url) : null);
  const previewSubtitle = [company.trim(), tagline.trim()].filter(Boolean).join(" · ");

  const logoPreviewRef = useRef(logoPreview);
  useEffect(() => {
    logoPreviewRef.current = logoPreview;
  }, [logoPreview]);
  useEffect(() => {
    return () => {
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    };
  }, []);

  const handleLogoChange = (file: File | null) => {
    setLogoError(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);

    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLogoError("File must be an image.");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image must be under 2MB.");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    posthog.capture("logo_uploaded", {
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
      category: categorySlug,
    });
  };

  useEffect(() => {
    if (state.status !== "success") return;
    if (!scriptReady) return;
    if (openedOrderIdRef.current === state.order.orderId) return;
    if (typeof window === "undefined" || !window.Razorpay) return;

    openedOrderIdRef.current = state.order.orderId;

    posthog.capture("checkout_started", {
      amount: state.order.amount,
      category: categorySlug,
      scope_category: scope.categorySlug ?? null,
      scope_today: !!scope.today,
      has_logo: !!logoFile,
      has_tagline: !!tagline.trim(),
      has_company: !!company.trim(),
    });

    const razorpay = new window.Razorpay({
      key: state.order.keyId,
      order_id: state.order.orderId,
      amount: state.order.amount * 100,
      currency: state.order.currency,
      name: "OutBid for Good",
      description: `Claim rank${label}`,
      prefill: { name: name.trim() },
      handler: () => {
        posthog.capture("checkout_payment_submitted", {
          amount: state.order.amount,
          category: categorySlug,
          scope_category: scope.categorySlug ?? null,
          scope_today: !!scope.today,
        });
        setPaymentPhase("submitted");
      },
      modal: {
        ondismiss: () => {
          posthog.capture("checkout_cancelled", {
            amount: state.order.amount,
            category: categorySlug,
            scope_category: scope.categorySlug ?? null,
          });
          setPaymentPhase("cancelled");
        },
      },
    });

    // Deferred so a synchronous throw from razorpay.open() sets state from a
    // callback, not directly in the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      try {
        razorpay.open();
      } catch (err) {
        posthog.captureException(err);
        posthog.capture("checkout_failed", {
          amount: state.order.amount,
          category: categorySlug,
          scope_category: scope.categorySlug ?? null,
        });
        setPaymentPhase("failed");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, scriptReady]);

  if (paymentPhase === "submitted" || paymentPhase === "cancelled" || paymentPhase === "failed") {
    const outcome = {
      submitted: {
        icon: <Clock size={20} className="text-warning" />,
        title: "Payment submitted",
        body: "We're confirming your payment now. Your rank goes live on the leaderboard only once that's done — check back shortly.",
        showRetry: false,
      },
      cancelled: {
        icon: <XCircle size={20} className="text-neutral-400" />,
        title: "Checkout cancelled",
        body: "Nothing was charged. You can try again whenever you're ready.",
        showRetry: true,
      },
      failed: {
        icon: <XCircle size={20} className="text-error" />,
        title: "Payment failed",
        body: "Nothing was charged. Try again.",
        showRetry: true,
      },
    }[paymentPhase];

    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">{outcome.icon}</span>
          <div>
            <p className="text-h3 text-neutral-900">{outcome.title}</p>
            <p className="text-body mt-1 text-neutral-500">{outcome.body}</p>
          </div>
        </div>
        {outcome.showRetry && (
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => {
              openedOrderIdRef.current = null;
              setPaymentPhase("idle");
            }}
          >
            Try again
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptError(true)}
      />

      <div className="flex items-center justify-between">
        <Badge variant="current">#1{label}</Badge>
        <p className="text-small text-neutral-500">Due now</p>
      </div>
      <p className="text-display mt-2 tabular-nums text-accent-500">
        ₹{amount.toLocaleString("en-IN")}
      </p>
      {categoryTitle && <p className="text-small text-neutral-500">{categoryTitle}</p>}

      <p className="text-small mt-3 border-t border-neutral-100 pt-3 text-neutral-500">
        Goes live on the leaderboard once payment confirms. Someone else can
        outbid you after that.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-md border border-neutral-100 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-small text-neutral-400">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            "?"
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-lg truncate text-neutral-900">{name.trim() || "Your name"}</p>
          {previewSubtitle && (
            <p className="text-small truncate text-neutral-500">{previewSubtitle}</p>
          )}
        </div>
        <span className="text-small shrink-0 font-semibold text-neutral-400">Preview</span>
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <label className={labelClass}>
          Display Name
          <input
            name="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="How you'll appear on the leaderboard"
          />
        </label>

        <label className={labelClass}>
          Company (optional)
          <input
            name="companyName"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Company or brand name"
          />
        </label>

        <label className={labelClass}>
          Website / handle URL
          <input
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
            placeholder="URL or @handle"
          />
          {urlError?.[0] && (
            <span className="text-small mt-1 block font-normal text-error">{urlError[0]}</span>
          )}
        </label>

        <label className={labelClass}>
          Tagline (optional)
          <textarea
            name="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value.slice(0, MAX_TAGLINE_LENGTH))}
            rows={2}
            className="text-body mt-1 block w-full resize-none rounded-md border border-neutral-200 bg-surface px-3 py-2 outline-none focus:border-primary-400"
            placeholder="A short line shown next to your name"
          />
          <span className="text-small mt-1 block font-normal text-neutral-500">
            {MAX_TAGLINE_LENGTH - tagline.length} characters left
          </span>
          {taglineError?.[0] && (
            <span className="text-small mt-1 block font-normal text-error">{taglineError[0]}</span>
          )}
        </label>

        <label className={labelClass}>
          Logo (optional)
          <input
            name="logo"
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            className="text-body mt-1 block w-full text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-small file:font-semibold"
          />
          {logoError && <span className="text-small mt-1 block font-normal text-error">{logoError}</span>}
        </label>

        <label className="text-small mt-1 flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-neutral-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          I have read and agree to the{" "}
          <a href="/terms" className="text-accent-500 underline">
            Terms of Service
          </a>
        </label>

        {state.status === "error" && (
          <p className="text-small text-error">{claimErrorMessage(state.error)}</p>
        )}
        {scriptError && (
          <p className="text-small text-error">Couldn&apos;t load checkout. Refresh and try again.</p>
        )}

        <Button variant="primary" className="mt-1 w-full" disabled={!canSubmit} type="submit">
          {pending ? "Preparing checkout…" : "Continue to checkout"}
        </Button>
      </form>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-small text-neutral-400">
        <Lock size={12} />
        Payments secured by Razorpay
      </div>
      {fundMessage && (
        <p className="text-small mt-1 text-center text-neutral-400">{fundMessage}</p>
      )}
    </Card>
  );
}
