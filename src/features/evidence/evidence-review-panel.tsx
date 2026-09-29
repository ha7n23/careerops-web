"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EvidenceApiError } from "@/features/evidence/browser-api";
import type {
  EvidenceDuplicateAction,
  EvidenceReview,
  EvidenceReviewDecision,
} from "@/features/evidence/contracts";
import {
  useEvidenceReview,
  useSubmitEvidenceReview,
} from "@/features/evidence/use-evidence";
import { cn } from "@/lib/utils";

type ProposalDecision = "approve" | "reject" | "edit";
type EditDraft = {
  title: string;
  technologies: string;
  capabilities: string;
  claims: string;
};

const duplicateActionLabels: Record<EvidenceDuplicateAction, string> = {
  keep_existing: "Keep existing evidence",
  accept_separate: "Keep both as separate evidence",
  replace_existing: "Replace existing evidence",
  merge_into_existing: "Merge into existing evidence",
};

export function EvidenceReviewPanel({ reviewRunId }: { reviewRunId: string }) {
  const reviewQuery = useEvidenceReview(reviewRunId);

  if (reviewQuery.isPending) {
    return (
      <section className="bg-card rounded-3xl border p-8 shadow-sm">
        <div
          role="status"
          className="text-muted-foreground flex items-center gap-3 text-sm"
        >
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Recovering evidence review…
        </div>
      </section>
    );
  }

  if (reviewQuery.isError) {
    return (
      <section
        role="alert"
        className="border-destructive/20 bg-card rounded-3xl border p-8 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Review could not be loaded</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {reviewQuery.error instanceof EvidenceApiError
            ? reviewQuery.error.message
            : "Check the CareerOps gateway and try again."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => void reviewQuery.refetch()}
        >
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </section>
    );
  }

  if (reviewQuery.data.status === "completed") {
    return <CompletedEvidenceReview review={reviewQuery.data} />;
  }

  if (reviewQuery.data.status === "invalid") {
    return (
      <section className="border-destructive/20 bg-card rounded-3xl border p-8 shadow-sm">
        <AlertTriangle className="text-destructive size-6" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">
          This source needs attention
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          CareerOps could not produce a reviewable evidence set from this
          source. Check the document warnings or add a clearer source.
        </p>
      </section>
    );
  }

  return <ReviewDecisionForm key={reviewRunId} review={reviewQuery.data} />;
}

function ReviewDecisionForm({ review }: { review: EvidenceReview }) {
  const [decisions, setDecisions] = useState<
    Record<string, ProposalDecision | undefined>
  >({});
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({});
  const [duplicateActions, setDuplicateActions] = useState<
    Record<string, EvidenceDuplicateAction | undefined>
  >({});
  const [reviewerComment, setReviewerComment] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const submitReview = useSubmitEvidenceReview();

  function chooseDecision(
    proposal: EvidenceReview["proposals"][number],
    decision: ProposalDecision,
  ) {
    setValidationMessage(null);
    setDecisions((current) => ({
      ...current,
      [proposal.proposalId]: decision,
    }));

    if (decision === "edit" && editDrafts[proposal.proposalId] === undefined) {
      setEditDrafts((current) => ({
        ...current,
        [proposal.proposalId]: {
          title: proposal.title,
          technologies: proposal.technologies.join(", "),
          capabilities: proposal.capabilities.join(", "),
          claims: proposal.claims.join("\n"),
        },
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationMessage(null);

    const undecided = review.proposals.filter(
      (proposal) => decisions[proposal.proposalId] === undefined,
    );

    if (undecided.length > 0) {
      setValidationMessage(
        `Review all ${review.proposals.length} proposals before submitting.`,
      );
      return;
    }

    const unresolvedOverlaps = review.overlapFindings.filter(
      (finding) => duplicateActions[overlapKey(finding)] === undefined,
    );

    if (unresolvedOverlaps.length > 0) {
      setValidationMessage("Resolve every reported overlap before submitting.");
      return;
    }

    const edits = review.proposals
      .filter((proposal) => decisions[proposal.proposalId] === "edit")
      .map((proposal) => {
        const draft = editDrafts[proposal.proposalId];
        return {
          proposalId: proposal.proposalId,
          title: draft.title.trim(),
          technologies: splitCommaList(draft.technologies),
          capabilities: splitCommaList(draft.capabilities),
          claims: splitLineList(draft.claims),
        };
      });

    if (edits.some((edit) => edit.title === "" || edit.claims.length === 0)) {
      setValidationMessage("Every edited proposal needs a title and claim.");
      return;
    }

    const decision: EvidenceReviewDecision = {
      approvedProposalIds: review.proposals
        .filter((proposal) => decisions[proposal.proposalId] === "approve")
        .map((proposal) => proposal.proposalId),
      rejectedProposalIds: review.proposals
        .filter((proposal) => decisions[proposal.proposalId] === "reject")
        .map((proposal) => proposal.proposalId),
      edits,
      duplicateResolutions: review.overlapFindings.map((finding) => ({
        proposalId: finding.proposalId,
        scope: finding.scope,
        action: duplicateActions[
          overlapKey(finding)
        ] as EvidenceDuplicateAction,
        matchingProposalId: finding.matchingProposalId,
        matchingEvidenceId: finding.matchingEvidenceId,
      })),
      reviewerComment:
        reviewerComment.trim() === "" ? null : reviewerComment.trim(),
    };

    try {
      await submitReview.mutateAsync({
        reviewRunId: review.reviewRunId,
        decision,
      });
    } catch {
      // The mutation error is rendered below.
    }
  }

  const mutationMessage =
    submitReview.error instanceof EvidenceApiError
      ? submitReview.error.message
      : submitReview.isError
        ? "The evidence decision could not be saved."
        : null;

  return (
    <section
      aria-labelledby="evidence-review-heading"
      className="bg-card overflow-hidden rounded-3xl border shadow-sm"
    >
      <div className="border-b px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
              Human review required
            </p>
            <h2
              id="evidence-review-heading"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              Verify extracted evidence
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Approve, reject or edit every proposal. CareerOps will only use
              the evidence you explicitly accept.
            </p>
          </div>
          <span className="bg-primary/10 text-primary w-fit rounded-full px-3 py-1.5 text-xs font-semibold">
            {review.proposals.length}{" "}
            {review.proposals.length === 1 ? "proposal" : "proposals"}
          </span>
        </div>

        {review.documentWarnings.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {review.documentWarnings.join(" ")}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
        {review.proposals.map((proposal, index) => {
          const decision = decisions[proposal.proposalId];
          const proposalOverlaps = review.overlapFindings.filter(
            (finding) => finding.proposalId === proposal.proposalId,
          );

          return (
            <article
              key={proposal.proposalId}
              className="overflow-hidden rounded-2xl border"
            >
              <div className="bg-muted/35 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">
                      Proposal {index + 1} · {proposal.category}
                    </p>
                    <h3 className="mt-1 font-semibold">{proposal.title}</h3>
                  </div>
                  <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-2.5 py-1 text-xs font-medium">
                    {proposal.sourceSection}
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {proposal.claims.map((claim) => (
                    <li key={claim} className="flex gap-2 text-sm leading-6">
                      <ShieldCheck
                        aria-hidden="true"
                        className="text-primary mt-1 size-4 shrink-0"
                      />
                      {claim}
                    </li>
                  ))}
                </ul>

                {proposal.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposal.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="bg-background text-muted-foreground rounded-lg border px-2.5 py-1 text-xs"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                )}

                {proposal.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="mt-4 flex gap-2 text-sm text-amber-800"
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    {warning}
                  </p>
                ))}
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <fieldset>
                  <legend className="text-sm font-medium">Your decision</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <DecisionButton
                      active={decision === "approve"}
                      icon={Check}
                      label="Approve"
                      tone="positive"
                      onClick={() => chooseDecision(proposal, "approve")}
                    />
                    <DecisionButton
                      active={decision === "edit"}
                      icon={PencilLine}
                      label="Edit & approve"
                      tone="neutral"
                      onClick={() => chooseDecision(proposal, "edit")}
                    />
                    <DecisionButton
                      active={decision === "reject"}
                      icon={X}
                      label="Reject"
                      tone="negative"
                      onClick={() => chooseDecision(proposal, "reject")}
                    />
                  </div>
                </fieldset>

                {decision === "edit" && editDrafts[proposal.proposalId] && (
                  <EditProposalFields
                    draft={editDrafts[proposal.proposalId]}
                    onChange={(draft) =>
                      setEditDrafts((current) => ({
                        ...current,
                        [proposal.proposalId]: draft,
                      }))
                    }
                  />
                )}

                {proposalOverlaps.map((finding) => {
                  const key = overlapKey(finding);
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-4"
                    >
                      <p className="text-sm font-semibold text-amber-950">
                        Possible duplicate found
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-900">
                        {finding.matchedClaims.join(" · ")}
                      </p>
                      <label
                        htmlFor={`overlap-${key}`}
                        className="mt-3 block text-xs font-medium text-amber-950"
                      >
                        Resolution
                      </label>
                      <select
                        id={`overlap-${key}`}
                        value={duplicateActions[key] ?? ""}
                        onChange={(event) =>
                          setDuplicateActions((current) => ({
                            ...current,
                            [key]: event.target
                              .value as EvidenceDuplicateAction,
                          }))
                        }
                        className="focus-visible:ring-ring/50 mt-1 h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm outline-none focus-visible:ring-3"
                      >
                        <option value="">Choose a resolution</option>
                        {finding.allowedActions.map((action) => (
                          <option key={action} value={action}>
                            {duplicateActionLabels[action]}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}

        <div>
          <label htmlFor="reviewer-comment" className="text-sm font-medium">
            Review note{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="reviewer-comment"
            value={reviewerComment}
            maxLength={1_000}
            rows={3}
            onChange={(event) => setReviewerComment(event.target.value)}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-3"
            placeholder="Record why you accepted, changed or rejected this evidence."
          />
        </div>

        {(validationMessage !== null || mutationMessage !== null) && (
          <p
            role="alert"
            className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
          >
            {validationMessage ?? mutationMessage}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={submitReview.isPending}
            className="rounded-xl px-5"
          >
            {submitReview.isPending ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            {submitReview.isPending ? "Saving review…" : "Approve evidence set"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function CompletedEvidenceReview({ review }: { review: EvidenceReview }) {
  const approvedCount = review.reviewResult?.approvedEvidence.length ?? 0;

  return (
    <section className="bg-card rounded-3xl border border-emerald-200 p-8 shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <CheckCircle2 aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
        Review completed
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        Evidence decisions saved
      </h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
        {approvedCount} {approvedCount === 1 ? "record is" : "records are"} now
        available to evidence-grounded job analysis. Rejected proposals were not
        added.
      </p>
    </section>
  );
}

function DecisionButton({
  active,
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  icon: typeof Check;
  label: string;
  onClick: () => void;
  tone: "positive" | "neutral" | "negative";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3",
        active && tone === "positive"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : active && tone === "negative"
            ? "border-red-300 bg-red-50 text-red-800"
            : active
              ? "border-primary/40 bg-primary/5 text-primary"
              : "hover:bg-muted",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function EditProposalFields({
  draft,
  onChange,
}: {
  draft: EditDraft;
  onChange: (draft: EditDraft) => void;
}) {
  return (
    <fieldset className="bg-muted/35 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
      <legend className="px-1 text-sm font-medium">Grounded edits</legend>
      <EditField
        label="Title"
        value={draft.title}
        onChange={(title) => onChange({ ...draft, title })}
      />
      <EditField
        label="Technologies (comma separated)"
        value={draft.technologies}
        onChange={(technologies) => onChange({ ...draft, technologies })}
      />
      <EditField
        label="Capabilities (comma separated)"
        value={draft.capabilities}
        onChange={(capabilities) => onChange({ ...draft, capabilities })}
      />
      <label className="text-sm font-medium">
        Claims (one per line)
        <textarea
          value={draft.claims}
          rows={4}
          onChange={(event) =>
            onChange({ ...draft, claims: event.target.value })
          }
          className="border-input bg-background focus-visible:ring-ring/50 mt-2 w-full rounded-lg border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-3"
        />
      </label>
    </fieldset>
  );
}

function EditField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background focus-visible:ring-ring/50 mt-2 h-10 w-full rounded-lg border px-3 text-sm font-normal outline-none focus-visible:ring-3"
      />
    </label>
  );
}

function overlapKey(
  finding: EvidenceReview["overlapFindings"][number],
): string {
  return [
    finding.proposalId,
    finding.scope,
    finding.matchingProposalId ?? finding.matchingEvidenceId ?? "unknown",
  ].join("-");
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function splitLineList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}
