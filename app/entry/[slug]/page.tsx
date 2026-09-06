import { notFound } from "next/navigation";
import { EntryDetailView } from "@/components/leaderboard/EntryDetail";
import { getEntryDetail, getSiteConfig } from "@/sanity/lib/data";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [entry, siteConfig] = await Promise.all([getEntryDetail(slug), getSiteConfig()]);

  if (!entry) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-8">
      <EntryDetailView entry={entry} minimumIncrement={siteConfig?.minimumIncrement ?? 0} />
    </main>
  );
}