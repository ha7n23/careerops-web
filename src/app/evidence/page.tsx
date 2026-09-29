import type { Metadata } from "next";

import { EvidenceWorkspace } from "@/features/evidence/evidence-workspace";

export const metadata: Metadata = {
  title: "Evidence",
};

export default function EvidencePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="max-w-3xl">
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            Source of truth
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Evidence workspace
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Turn trusted career material into approved, reusable evidence for
            every job analysis and final CV.
          </p>
        </header>

        <EvidenceWorkspace />
      </div>
    </main>
  );
}
