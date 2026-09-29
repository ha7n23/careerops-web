import { ArrowRight, Database, FileUp, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-card relative overflow-hidden rounded-3xl border p-7 shadow-sm sm:p-9">
            <div
              aria-hidden="true"
              className="bg-primary/10 absolute -top-16 -right-12 size-52 rounded-full blur-3xl"
            />
            <div className="relative">
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                <FileUp aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-6 text-xl font-semibold tracking-tight">
                Evidence intake arrives in Slice 2
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
                The platform boundary is now ready. The next slice connects
                document upload, pasted text, extraction review and duplicate
                resolution to the frozen Module 2 contract.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-3xl border p-7 shadow-sm">
            <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-2xl">
              <Search aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-6 text-lg font-semibold tracking-tight">
              Already tracking roles?
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              Your existing development applications remain available while we
              add the evidence workflow.
            </p>
            <Link
              href="/applications"
              className="text-primary focus-visible:ring-ring/50 mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium outline-none focus-visible:ring-3"
            >
              Open applications
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <div className="border-primary/15 bg-primary/5 flex items-start gap-4 rounded-2xl border p-5">
          <Database
            aria-hidden="true"
            className="text-primary mt-0.5 size-5 shrink-0"
          />
          <div>
            <h2 className="text-sm font-semibold">Evidence stays reusable</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Once approved, evidence becomes the grounding layer for future
              analysis instead of relying on one uploaded CV.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
