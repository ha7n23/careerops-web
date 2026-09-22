import { ApplicationsPanel } from "@/features/applications/applications-panel";
import { PendingActionsPanel } from "@/features/applications/pending-actions-panel";

export default function Home() {
  return (
    <main className="bg-muted/30 min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 sm:px-8 lg:py-16">
        <header className="max-w-3xl space-y-4">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase">
            CareerOps
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Build stronger applications with evidence.
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base leading-7 sm:text-lg">
            Track each opportunity and keep your AI-assisted application work in
            one dependable workspace.
          </p>
        </header>

        <PendingActionsPanel />
        <ApplicationsPanel />
      </div>
    </main>
  );
}
