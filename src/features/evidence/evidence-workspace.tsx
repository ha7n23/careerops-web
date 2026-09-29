"use client";

import { useState } from "react";

import { EvidenceHistoryPanel } from "@/features/evidence/evidence-history-panel";
import { EvidenceIntakeForm } from "@/features/evidence/evidence-intake-form";
import { EvidenceRegistryWorkspace } from "@/features/evidence/evidence-registry-workspace";
import { EvidenceReviewPanel } from "@/features/evidence/evidence-review-panel";

export function EvidenceWorkspace() {
  const [activeView, setActiveView] = useState<"intake" | "registry">("intake");
  const [activeReviewRunId, setActiveReviewRunId] = useState<string | null>(
    null,
  );

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="Evidence workspace views"
        className="bg-muted/70 inline-flex rounded-2xl border p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "intake"}
          className="aria-selected:bg-card aria-selected:text-foreground text-muted-foreground rounded-xl px-4 py-2.5 text-sm font-medium transition aria-selected:shadow-sm"
          onClick={() => setActiveView("intake")}
        >
          Intake & review
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "registry"}
          className="aria-selected:bg-card aria-selected:text-foreground text-muted-foreground rounded-xl px-4 py-2.5 text-sm font-medium transition aria-selected:shadow-sm"
          onClick={() => setActiveView("registry")}
        >
          Evidence Registry
        </button>
      </div>

      {activeView === "intake" ? (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
            <EvidenceIntakeForm onReviewStarted={setActiveReviewRunId} />
            <EvidenceHistoryPanel onReviewSelected={setActiveReviewRunId} />
          </div>

          {activeReviewRunId !== null && (
            <EvidenceReviewPanel
              key={activeReviewRunId}
              reviewRunId={activeReviewRunId}
            />
          )}
        </>
      ) : (
        <EvidenceRegistryWorkspace />
      )}
    </div>
  );
}
