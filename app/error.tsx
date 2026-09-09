"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Route-level backstop: a throw in any server component or action (for
// example an unhandled Sanity read) would otherwise escape with nothing to
// show the user. Report it so the failure is visible, then offer a retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <p className="text-h3 text-neutral-900">Something went wrong</p>
        <p className="text-body mt-2 text-neutral-500">
          We hit an error loading this page. Nothing was charged. Try again.
        </p>
        <Button variant="primary" className="mt-4 w-full" onClick={() => reset()}>
          Try again
        </Button>
      </Card>
    </main>
  );
}
