import type { Metadata } from "next";

import { ApplicationsPanel } from "@/features/applications/applications-panel";

export const metadata: Metadata = {
  title: "Applications",
};

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="max-w-3xl">
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            Application pipeline
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Applications
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Track roles, prepare evidence-grounded analysis and review every CV
            proposal before it becomes part of an application.
          </p>
        </header>

        <ApplicationsPanel />
      </div>
    </main>
  );
}
