"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — no
      // further fallback needed, the Visit button still reaches the same URL.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopyLink}
      className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary-100 px-4 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-200"
    >
      {copied ? <Check size={16} /> : <Link2 size={16} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
