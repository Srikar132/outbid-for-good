"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Lock, XCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import posthog from "posthog-js";
import { Scope } from "@/lib/scope";
import { faviconUrlFor, isValidHttpUrl } from "@/lib/identity";

type Status = "idle" | "submitting" | "submitted" | "cancelled" | "failed";

const MAX_TAGLINE_LENGTH = 140;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

let checkoutScriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });

  return checkoutScriptPromise;
}

const inputClass =
  "text-body mt-1 block h-11 w-full rounded-md border border-neutral-200 bg-surface px-3 outline-none focus:border-primary-400";
const labelClass = "text-small font-semibold text-neutral-700";

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
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState(initialUrl);
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

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
  const canSubmit =
    agreed &&
    name.trim().length > 0 &&
    isValidHttpUrl(url.trim()) &&
    status !== "submitting";

  const trimmedUrl = url.trim();
  const avatarSrc = logoPreview ?? (isValidHttpUrl(trimmedUrl) ? faviconUrlFor(trimmedUrl) : null);
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

  const handleSubmit = async () => {
    setError(null);
    setStatus("submitting");

    try {
      let logoAssetId: string | undefined;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const uploadRes = await fetch("/api/upload-logo", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Couldn't upload logo. Try again.");
          setStatus("idle");
          return;
        }
        logoAssetId = uploadData.assetId;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          entryCategorySlug: categorySlug,
          scopeCategorySlug: scope.categorySlug ?? null,
          today: !!scope.today,
          displayName: name.trim(),
          companyName: company.trim() || undefined,
          url: trimmedUrl,
          tagline: tagline.trim() || undefined,
          logoAssetId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setStatus("idle");
        return;
      }

      await loadCheckoutScript();

      posthog.capture("checkout_started", {
        amount,
        category: categorySlug,
        scope_category: scope.categorySlug ?? null,
        scope_today: !!scope.today,
        has_logo: !!logoAssetId,
        has_tagline: !!(tagline.trim()),
        has_company: !!(company.trim()),
      });

      const razorpay = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount * 100,
        currency: data.currency,
        name: "OutBid for Good",
        description: `Claim rank${label}`,
        prefill: { name: name.trim() },
        handler: () => {
          posthog.capture("checkout_payment_submitted", {
            amount,
            category: categorySlug,
            scope_category: scope.categorySlug ?? null,
            scope_today: !!scope.today,
          });
          setStatus("submitted");
        },
        modal: {
          ondismiss: () => {
            posthog.capture("checkout_cancelled", {
              amount,
              category: categorySlug,
              scope_category: scope.categorySlug ?? null,
            });
            setStatus("cancelled");
          },
        },
      });

      razorpay.open();
    } catch (err) {
      posthog.captureException(err);
      posthog.capture("checkout_failed", {
        amount,
        category: categorySlug,
        scope_category: scope.categorySlug ?? null,
      });
      setError("Couldn't reach checkout. Try again.");
      setStatus("failed");
    }
  };

  if (status === "submitted" || status === "cancelled" || status === "failed") {
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
    }[status];

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
          <Button variant="secondary" className="mt-4 w-full" onClick={() => setStatus("idle")}>
            Try again
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card>
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

      <div className="mt-4 flex flex-col gap-3">
        <label className={labelClass}>
          Display Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="How you'll appear on the leaderboard"
          />
        </label>

        <label className={labelClass}>
          Company (optional)
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Company or brand name"
          />
        </label>

        <label className={labelClass}>
          Website / handle URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
            placeholder="https://your-link.com"
          />
          {url.trim().length > 0 && !isValidHttpUrl(url.trim()) && (
            <span className="text-small mt-1 block font-normal text-error">
              Enter a valid http(s) URL.
            </span>
          )}
        </label>

        <label className={labelClass}>
          Tagline (optional)
          <textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value.slice(0, MAX_TAGLINE_LENGTH))}
            rows={2}
            className="text-body mt-1 block w-full resize-none rounded-md border border-neutral-200 bg-surface px-3 py-2 outline-none focus:border-primary-400"
            placeholder="A short line shown next to your name"
          />
          <span className="text-small mt-1 block font-normal text-neutral-500">
            {MAX_TAGLINE_LENGTH - tagline.length} characters left
          </span>
        </label>

        <label className={labelClass}>
          Logo (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            className="text-body mt-1 block w-full text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-small file:font-semibold"
          />
          {logoError && <span className="text-small mt-1 block font-normal text-error">{logoError}</span>}
        </label>
      </div>

      <label className="text-small mt-4 flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-neutral-700">
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

      {error && <p className="text-small mt-2 text-error">{error}</p>}

      <Button
        variant="primary"
        className="mt-4 w-full"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {status === "submitting" ? "Preparing checkout…" : "Continue to checkout"}
      </Button>

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
