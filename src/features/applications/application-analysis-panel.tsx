"use client";

import {
  BarChart3,
  CircleAlert,
  FileText,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApplicationAnalysis } from "@/features/applications/analysis-contracts";
import { ApplicationsApiError } from "@/features/applications/browser-api";
import { useApplicationAnalysis } from "@/features/applications/use-applications";

type ApplicationAnalysisPanelProps = {
  applicationId: string;
};

const ANALYSIS_STATUS_LABELS = {
  awaiting_review: "Awaiting review",
  completed: "Completed",
} as const;

const MATCH_STRENGTH_LABELS = {
  strong: "Strong match",
  partial: "Partial match",
  related: "Related evidence",
  none: "No match",
} as const;

const SECTION_LABELS = {
  profile: "Profile",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
} as const;

export function ApplicationAnalysisPanel({
  applicationId,
}: ApplicationAnalysisPanelProps) {
  const { data, error, isPending, isFetching, refetch } =
    useApplicationAnalysis(applicationId);

  if (isPending) {
    return <ApplicationAnalysisLoading />;
  }

  if (
    error instanceof ApplicationsApiError &&
    error.code === "ANALYSIS_NOT_AVAILABLE"
  ) {
    return <ApplicationAnalysisUnavailable />;
  }

  if (error !== null) {
    return (
      <ApplicationAnalysisError
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return <ApplicationAnalysisContent data={data} />;
}

function ApplicationAnalysisContent({ data }: { data: ApplicationAnalysis }) {
  const evidenceByRequirement = new Map(
    data.analysis.evidenceMatches.map((match) => [match.requirementId, match]),
  );

  return (
    <section aria-labelledby="analysis-title" className="space-y-6">
      <div className="bg-card flex flex-col gap-5 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Preparation results</p>
          <h2 id="analysis-title" className="mt-1 text-2xl font-semibold">
            Application analysis
          </h2>
        </div>

        <span className="bg-muted text-muted-foreground w-fit rounded-full px-3 py-1 text-sm font-medium">
          {ANALYSIS_STATUS_LABELS[data.analysis.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="bg-muted w-fit rounded-xl p-3">
            <BarChart3
              aria-hidden="true"
              className="text-muted-foreground size-5"
            />
          </div>

          <p className="text-muted-foreground mt-5 text-sm">Overall fit</p>

          <p
            aria-label={`Overall fit: ${Math.round(
              data.analysis.fitScore,
            )} percent`}
            className="mt-1 text-4xl font-semibold tracking-tight"
          >
            {Math.round(data.analysis.fitScore)}%
          </p>

          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Based on verified career evidence matched against this role.
          </p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles aria-hidden="true" className="size-5" />
            <h3 className="text-lg font-semibold">Requirements and evidence</h3>
          </div>

          {data.analysis.requirements.length === 0 ? (
            <p className="text-muted-foreground mt-5 text-sm">
              No requirements were returned for this analysis.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {data.analysis.requirements.map((requirement) => {
                const evidence = evidenceByRequirement.get(requirement.id);

                return (
                  <article
                    key={requirement.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-medium">{requirement.name}</h4>

                        <p className="text-muted-foreground mt-1 text-sm capitalize">
                          {requirement.category} · Importance{" "}
                          {requirement.importanceScore}/5
                        </p>
                      </div>

                      {evidence !== undefined && (
                        <span className="bg-muted text-muted-foreground w-fit rounded-full px-3 py-1 text-xs font-medium">
                          {MATCH_STRENGTH_LABELS[evidence.matchStrength]}
                        </span>
                      )}
                    </div>

                    {evidence !== undefined && (
                      <div className="mt-3 flex items-start gap-2">
                        {evidence.gap && (
                          <CircleAlert
                            aria-label="Evidence gap"
                            className="text-destructive mt-0.5 size-4 shrink-0"
                          />
                        )}

                        <p className="text-muted-foreground text-sm leading-6">
                          {evidence.explanation}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText aria-hidden="true" className="size-5" />
          <h3 className="text-lg font-semibold">CV proposals</h3>
        </div>

        {data.analysis.cvProposals.length === 0 ? (
          <p className="text-muted-foreground mt-5 text-sm">
            No CV changes were proposed for this application.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {data.analysis.cvProposals.map((proposal) => (
              <article key={proposal.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">
                    {SECTION_LABELS[proposal.section]}
                  </p>

                  <span className="text-muted-foreground text-xs">
                    {Math.round(proposal.confidenceScore * 100)}% confidence
                  </span>
                </div>

                {proposal.currentText !== null && (
                  <div className="mt-4">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Current
                    </p>

                    <p className="mt-1 text-sm leading-6">
                      {proposal.currentText}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Proposed
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {proposal.proposedText}
                  </p>
                </div>

                {proposal.warnings.length > 0 && (
                  <ul className="text-destructive mt-4 list-disc space-y-1 pl-5 text-sm">
                    {proposal.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ApplicationAnalysisLoading() {
  return (
    <div
      role="status"
      aria-label="Loading application analysis"
      className="bg-card space-y-4 rounded-2xl border p-6 shadow-sm"
    >
      <span className="sr-only">Loading application analysis…</span>

      <div
        aria-hidden="true"
        className="bg-muted h-7 w-56 animate-pulse rounded"
      />

      <div
        aria-hidden="true"
        className="bg-muted h-40 animate-pulse rounded-xl"
      />
    </div>
  );
}

function ApplicationAnalysisUnavailable() {
  return (
    <section
      aria-labelledby="analysis-title"
      className="bg-card rounded-2xl border p-6 shadow-sm"
    >
      <div className="bg-muted w-fit rounded-xl p-3">
        <Sparkles aria-hidden="true" className="text-muted-foreground size-5" />
      </div>

      <h2 id="analysis-title" className="mt-5 text-xl font-semibold">
        No application analysis yet
      </h2>

      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
        This application has been saved, but CareerOps has not prepared it yet.
      </p>
    </section>
  );
}

function ApplicationAnalysisError({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/5 flex flex-col items-start gap-4 rounded-2xl border p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Analysis could not be loaded</h2>

        <p className="text-muted-foreground mt-1 text-sm leading-6">
          The application is available, but its preparation results could not be
          retrieved.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isRetrying}
        onClick={onRetry}
      >
        <RefreshCw
          aria-hidden="true"
          className={isRetrying ? "animate-spin" : undefined}
        />

        {isRetrying ? "Trying again" : "Try again"}
      </Button>
    </div>
  );
}
