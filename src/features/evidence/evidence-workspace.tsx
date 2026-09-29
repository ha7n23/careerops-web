"use client";

import { useState } from "react";

import { EvidenceHistoryPanel } from "@/features/evidence/evidence-history-panel";
import { EvidenceIntakeForm } from "@/features/evidence/evidence-intake-form";
import { EvidenceReviewPanel } from "@/features/evidence/evidence-review-panel";

export function EvidenceWorkspace() {
  const [activeReviewRunId, setActiveReviewRunId] = useState<string | null>(
    null,
  );

  return (
    <div className="space-y-8">
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
    </div>
  );
}
