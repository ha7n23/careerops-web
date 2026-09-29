import { ArrowRight, Database, FileCheck2, WandSparkles } from "lucide-react";
import Link from "next/link";

import { ApplicationsPanel } from "@/features/applications/applications-panel";
import { PendingActionsPanel } from "@/features/applications/pending-actions-panel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="border-border/70 relative overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--card),color-mix(in_oklch,var(--accent),white_40%))] p-7 shadow-sm sm:p-9">
          <div
            aria-hidden="true"
            className="bg-primary/10 absolute -top-20 -right-16 size-64 rounded-full blur-3xl"
          />

          <div className="relative max-w-3xl">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Your career command centre
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              Turn verified experience into stronger applications.
            </h1>

            <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7 sm:text-lg">
              Keep your evidence, job analysis and application decisions in one
              dependable workspace—without inventing a claim.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/applications"
                className="bg-primary text-primary-foreground focus-visible:ring-ring/50 hover:bg-primary/90 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition-colors outline-none focus-visible:ring-3"
              >
                Open applications
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>

              <Link
                href="/evidence"
                className="border-border bg-background/80 text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3"
              >
                View evidence workspace
              </Link>
            </div>
          </div>
        </header>

        <section
          aria-label="CareerOps workflow"
          className="grid gap-3 md:grid-cols-3"
        >
          <WorkflowCard
            icon={Database}
            eyebrow="Step 1"
            title="Build your evidence"
            description="Approve reusable facts from trusted CVs and pasted experience."
          />
          <WorkflowCard
            icon={WandSparkles}
            eyebrow="Step 2"
            title="Analyse the role"
            description="See requirements, evidence matches, gaps and fit before editing."
          />
          <WorkflowCard
            icon={FileCheck2}
            eyebrow="Step 3"
            title="Review every claim"
            description="Approve safe proposals before CareerOps produces final documents."
          />
        </section>

        <PendingActionsPanel />
        <ApplicationsPanel />
      </div>
    </main>
  );
}

function WorkflowCard({
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  description: string;
  eyebrow: string;
  icon: typeof Database;
  title: string;
}) {
  return (
    <article className="bg-card/85 rounded-2xl border p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <p className="text-primary text-[0.68rem] font-semibold tracking-[0.14em] uppercase">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-4 font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {description}
      </p>
    </article>
  );
}
