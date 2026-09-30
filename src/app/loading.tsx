export default function Loading() {
  return (
    <main className="min-h-screen" aria-busy="true">
      <div
        role="status"
        aria-label="Loading CareerOps workspace"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
      >
        <span className="sr-only">Loading CareerOps workspace…</span>
        <div
          aria-hidden="true"
          className="bg-muted h-36 animate-pulse rounded-3xl"
        />
        <div aria-hidden="true" className="grid gap-4 md:grid-cols-3">
          <div className="bg-muted h-28 animate-pulse rounded-2xl" />
          <div className="bg-muted h-28 animate-pulse rounded-2xl" />
          <div className="bg-muted h-28 animate-pulse rounded-2xl" />
        </div>
        <div
          aria-hidden="true"
          className="bg-muted h-72 animate-pulse rounded-2xl"
        />
      </div>
    </main>
  );
}
