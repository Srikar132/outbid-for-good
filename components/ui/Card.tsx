import { ReactNode } from "react";
import { TrendingUp, Heart, CheckCircle2, Leaf } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CurrentRankCard({
  amount,
  donor,
  nextMinimumBid,
}: {
  amount: string;
  donor: string;
  nextMinimumBid: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">
          Current #1
        </p>
        <Badge variant="current">#1 Current</Badge>
      </div>
      <p className="text-display mt-2 text-neutral-900">{amount}</p>
      <p className="text-small text-neutral-500">{donor}</p>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <div>
          <p className="text-small text-neutral-500">Next minimum bid</p>
          <p className="text-body-lg text-neutral-900">{nextMinimumBid}</p>
        </div>
        <TrendingUp size={20} className="text-primary-400" />
      </div>
    </Card>
  );
}

export function DonateCard() {
  return (
    <Card>
      <Heart size={20} className="text-accent-500" fill="currentColor" />
      <p className="text-h3 mt-2 text-neutral-900">Outbid & Donate</p>
      <p className="text-body mt-1 text-neutral-500">
        Be the next top donor and create a bigger impact.
      </p>
      <Button variant="primary" className="mt-4 w-full">
        Outbid & Donate
      </Button>
    </Card>
  );
}

export function PaymentStatusCard({
  amount,
  transactionId,
  confirmedAgo,
}: {
  amount: string;
  transactionId: string;
  confirmedAgo: string;
}) {
  return (
    <Card>
      <p className="text-body-lg text-neutral-900">Payment Status</p>
      <div className="mt-2 flex items-center gap-2 text-success">
        <CheckCircle2 size={16} />
        <p className="text-body font-semibold">Payment Confirmed</p>
      </div>
      <p className="text-display mt-2 text-neutral-900">{amount}</p>
      <p className="text-small mt-1 text-neutral-500">
        Transaction ID: {transactionId}
      </p>
      <p className="text-small text-neutral-500">
        Confirmed via webhook &bull; {confirmedAgo}
      </p>
    </Card>
  );
}

export function CauseCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <div className="flex h-32 items-center justify-center rounded-md bg-primary-100">
        <Leaf size={32} className="text-primary-400" />
      </div>
      <p className="text-small mt-3 font-semibold uppercase tracking-wide text-neutral-500">
        Our Cause
      </p>
      <p className="text-h3 mt-1 text-neutral-900">{title}</p>
      <p className="text-body mt-1 text-neutral-500">{description}</p>
      <a href="#" className="text-small mt-3 inline-block font-semibold text-primary-500">
        Learn more about this cause &rarr;
      </a>
    </Card>
  );
}
