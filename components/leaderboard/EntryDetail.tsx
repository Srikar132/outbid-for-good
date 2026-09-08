import Link from "next/link";
import { Crown, ArrowUpRight, AtSign } from "lucide-react";
import { EntryDetailResult } from "@/sanity/lib/data";
import { formatAmount, isWithinLastDay, timeAgo } from "@/lib/format";
import { categoryIcons } from "@/lib/category-icons";
import { faviconUrlFor, isHandleStyleUrl } from "@/lib/identity";
import { CopyLinkButton } from "./CopyLinkButton";

function StatCard({
  label,
  rank,
  total,
  scopeLabel,
  href,
}: {
  label: string;
  rank: number;
  total: number;
  scopeLabel: string;
  href: string;
}) {
  const isTop = rank === 1;
  return (
    <Link
      href={href}
      className={`flex-1 rounded-lg border bg-surface p-5 transition-colors dark:ring-1 dark:ring-white/5 ${
        isTop ? "border-accent-500" : "border-neutral-200 hover:border-accent-300"
      }`}
    >
      <p className="text-small font-medium text-neutral-500">{label}</p>
      <p className={`text-display mt-1 tabular-nums ${isTop ? "text-accent-500" : "text-neutral-900"}`}>
        #{rank}
      </p>
      <p className="text-body text-neutral-500">
        of {total} {scopeLabel}
      </p>
    </Link>
  );
}

function SiblingRow({
  rank,
  name,
  amount,
  href,
}: {
  rank: number;
  name: string;
  amount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-surface p-3 transition-colors hover:border-accent-300 dark:ring-1 dark:ring-white/5"
    >
      <span className="text-body w-8 shrink-0 tabular-nums text-neutral-400">#{rank}</span>
      <span className="text-body-lg min-w-0 flex-1 truncate text-neutral-900">{name}</span>
      <span className="text-body-lg shrink-0 tabular-nums text-accent-500">
        {formatAmount(amount)}
      </span>
    </Link>
  );
}

export function EntryDetailView({
  entry,
  minimumIncrement,
}: {
  entry: EntryDetailResult;
  minimumIncrement: number;
}) {
  const CategoryIcon = categoryIcons[entry.category.slug];
  const name = entry.companyName ?? entry.displayName;
  const clickCount = entry.clickCount ?? 0;
  const raiseCount = entry.raiseCount ?? 1;
  const isOverallTop = entry.overallRank === 1;
  const isToday = isWithinLastDay(entry.confirmedAt);
  const nextMinBid = entry.amount + minimumIncrement;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-small text-neutral-500">
        <Link href="/" className="hover:text-neutral-700">
          Leaderboard
        </Link>{" "}
        &middot;{" "}
        <Link href={`/category/${entry.category.slug}`} className="hover:text-neutral-700">
          {entry.category.title}
        </Link>
      </p>

      <div
        className={`rounded-lg border bg-surface p-6 dark:ring-1 dark:ring-white/5 ${
          isOverallTop ? "border-accent-500" : "border-neutral-200"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-50 text-accent-500 shadow-sm">
            {entry.url && isHandleStyleUrl(entry.url) ? (
              <AtSign size={28} />
            ) : entry.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrlFor(entry.url)}
                alt=""
                className="h-8 w-8 object-contain"
              />
            ) : (
              CategoryIcon && <CategoryIcon size={28} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h2 break-words text-neutral-900">{name}</h1>
              {isOverallTop && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <Crown size={12} fill="currentColor" /> Current #1
                </span>
              )}
            </div>
            <p className="text-small mt-1.5 flex items-center gap-1.5 text-neutral-500">
              {CategoryIcon && <CategoryIcon size={12} />}
              <span>{entry.category.title}</span>
              <span className="text-neutral-300">&bull;</span>
              <span>{timeAgo(entry.confirmedAt)}</span>
            </p>
            {entry.tagline && (
              <p className="text-body mt-3 text-neutral-700">{entry.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/api/click/${entry._id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-accent-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
              >
                Visit <ArrowUpRight size={16} />
              </a>
              <CopyLinkButton url={entry.url} />
            </div>
          </div>

          <p className="text-display shrink-0 tabular-nums text-accent-500">
            {formatAmount(entry.amount)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <StatCard
          label="Category rank"
          rank={entry.categoryRank}
          total={entry.categoryTotal}
          scopeLabel={`in ${entry.category.title}`}
          href={`/category/${entry.category.slug}`}
        />
        <StatCard
          label="Overall rank"
          rank={entry.overallRank}
          total={entry.overallTotal}
          scopeLabel="on the board"
          href="/"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-neutral-200 pt-5">
        <h2 className="text-h3 text-neutral-900">About this ranking</h2>
        <p className="text-body text-neutral-700">
          {name} has donated {formatAmount(entry.amount)}
          {raiseCount > 1 ? ` across ${raiseCount} confirmed payments` : ""} to this
          cause. {clickCount} people have clicked through to their link so far.
        </p>

        <div>
          <p className="text-body-lg font-semibold text-neutral-900">
            What rank does {name} hold?
          </p>
          <p className="text-body text-neutral-700">
            {name} has donated {formatAmount(entry.amount)} to rank #{entry.categoryRank} of{" "}
            {entry.categoryTotal} in {entry.category.title} and #{entry.overallRank} of{" "}
            {entry.overallTotal} overall, in this donation cycle.
          </p>
        </div>

        <div>
          <p className="text-body-lg font-semibold text-neutral-900">
            Has {name} donated today?
          </p>
          <p className="text-body text-neutral-700">
            {isToday
              ? `Yes — this donation was confirmed within the last 24 hours.`
              : `Not in the last 24 hours — this donation was confirmed ${timeAgo(entry.confirmedAt)}.`}
          </p>
        </div>

        <div>
          <p className="text-body-lg font-semibold text-neutral-900">
            {entry.cycle.isActive ? `How do I outbid ${name}?` : "Can this be outbid?"}
          </p>
          {entry.cycle.isActive ? (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-md bg-primary-100 px-3 py-2">
              <p className="text-small text-primary-500">
                Anyone can take this rank for {formatAmount(nextMinBid)} or more.
              </p>
              <Link
                href={`/donate?amount=${nextMinBid}&category=${entry.category.slug}`}
                className="text-small font-semibold text-primary-500 underline"
              >
                Donate
              </Link>
            </div>
          ) : (
            <p className="text-body text-neutral-700">
              This donation cycle has ended — it&apos;s part of the past-champions archive and can
              no longer be outbid.
            </p>
          )}
        </div>
      </div>

      {entry.siblings.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 text-neutral-900">Also in {entry.category.title}</h2>
            <Link
              href={`/category/${entry.category.slug}`}
              className="text-small font-semibold text-primary-500"
            >
              See all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {entry.siblings.map((sibling) => (
              <SiblingRow
                key={sibling._id}
                rank={sibling.rank}
                name={sibling.companyName ?? sibling.displayName}
                amount={sibling.amount}
                href={`/entry/${sibling.slug}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
