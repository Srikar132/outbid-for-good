export function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-h1 text-neutral-900">{title}</h1>
      <p className="text-body mt-2 text-neutral-500">This page is coming soon.</p>
    </main>
  );
}
