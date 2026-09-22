"use client";

import { Check, LoaderCircle, Pencil, RefreshCw, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_EDIT_MAX_LENGTH,
  type ApplicationReviewAction,
  type ReviewApplicationRequest,
} from "@/features/applications/review-contracts";
import { useReviewApplication } from "@/features/applications/use-applications";

type ReviewableProposal = {
  id: string;
  proposedText: string;
};

type ApplicationReviewControlsProps = {
  applicationId: string;
  reviewableProposals: ReviewableProposal[];
  allowedReviewActions: ApplicationReviewAction[];
};

type ReviewMode = "edit" | "regenerate";

type ReviewAttempt = {
  fingerprint: string;
  idempotencyKey: string;
};

type ReviewDecision = Omit<ReviewApplicationRequest, "idempotencyKey">;

export function ApplicationReviewControls({
  applicationId,
  reviewableProposals,
  allowedReviewActions,
}: ApplicationReviewControlsProps) {
  const [mode, setMode] = useState<ReviewMode | null>(null);

  const [editedTexts, setEditedTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      reviewableProposals.map((proposal) => [
        proposal.id,
        proposal.proposedText,
      ]),
    ),
  );

  const [regenerationFeedback, setRegenerationFeedback] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [reviewAttempt, setReviewAttempt] = useState<ReviewAttempt | null>(
    null,
  );

  const { mutateAsync, isPending, error, variables } = useReviewApplication();

  const reviewableProposalIds = reviewableProposals.map(
    (proposal) => proposal.id,
  );

  const canApprove = allowedReviewActions.includes("approve");
  const canEdit = allowedReviewActions.includes("edit");
  const canReject = allowedReviewActions.includes("reject");
  const canRegenerate = allowedReviewActions.includes("regenerate");

  if (!canApprove && !canEdit && !canReject && !canRegenerate) {
    return null;
  }

  async function submitReview(decision: ReviewDecision) {
    const fingerprint = JSON.stringify(decision);

    const idempotencyKey =
      reviewAttempt?.fingerprint === fingerprint
        ? reviewAttempt.idempotencyKey
        : crypto.randomUUID();

    setReviewAttempt({ fingerprint, idempotencyKey });
    setValidationError(null);

    try {
      await mutateAsync({
        applicationId,
        input: {
          idempotencyKey,
          ...decision,
        },
      });

      setReviewAttempt(null);
    } catch {
      // React Query exposes the safe request error through `error` below.
    }
  }

  async function submitSimpleDecision(action: "approve" | "reject") {
    await submitReview({
      action,
      approvedProposalIds: action === "approve" ? reviewableProposalIds : [],
      rejectedProposalIds: action === "reject" ? reviewableProposalIds : [],
      edits: [],
      reviewerComment: null,
    });
  }

  async function submitEdits() {
    const edits = reviewableProposals.map((proposal) => ({
      proposalId: proposal.id,
      editedText: editedTexts[proposal.id]?.trim() ?? "",
    }));

    if (edits.some((edit) => edit.editedText.length === 0)) {
      setValidationError("Enter replacement text for every proposal.");
      return;
    }

    if (edits.some((edit) => edit.editedText.length > REVIEW_EDIT_MAX_LENGTH)) {
      setValidationError(
        `Each edited proposal must be ${REVIEW_EDIT_MAX_LENGTH.toLocaleString()} characters or fewer.`,
      );
      return;
    }

    await submitReview({
      action: "edit",
      approvedProposalIds: [],
      rejectedProposalIds: [],
      edits,
      reviewerComment: null,
    });
  }

  async function submitRegeneration() {
    const reviewerComment = regenerationFeedback.trim();

    if (reviewerComment.length === 0) {
      setValidationError("Explain what should change in the new proposals.");
      return;
    }

    if (reviewerComment.length > REVIEW_COMMENT_MAX_LENGTH) {
      setValidationError(
        `Regeneration feedback must be ${REVIEW_COMMENT_MAX_LENGTH.toLocaleString()} characters or fewer.`,
      );
      return;
    }

    await submitReview({
      action: "regenerate",
      approvedProposalIds: [],
      rejectedProposalIds: reviewableProposalIds,
      edits: [],
      reviewerComment,
    });
  }

  function openMode(nextMode: ReviewMode) {
    setMode(nextMode);
    setValidationError(null);
  }

  function closeMode() {
    setMode(null);
    setValidationError(null);
  }

  const pendingAction = isPending ? variables?.input.action : undefined;

  return (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Review CV proposals</h3>

      <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
        Choose what happens to every proposal currently marked for review. None
        of these actions submits the job application to the employer.
      </p>

      {error !== null && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          The review outcome could not be confirmed. Check the latest
          application state before retrying the same decision.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {canApprove && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void submitSimpleDecision("approve")}
          >
            {pendingAction === "approve" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Check aria-hidden="true" />
            )}

            {pendingAction === "approve"
              ? "Approving proposals"
              : "Approve all proposals"}
          </Button>
        )}

        {canEdit && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            aria-expanded={mode === "edit"}
            onClick={() => openMode("edit")}
          >
            <Pencil aria-hidden="true" />
            Edit proposals
          </Button>
        )}

        {canRegenerate && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            aria-expanded={mode === "regenerate"}
            onClick={() => openMode("regenerate")}
          >
            <RefreshCw aria-hidden="true" />
            Regenerate proposals
          </Button>
        )}

        {canReject && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void submitSimpleDecision("reject")}
          >
            {pendingAction === "reject" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <X aria-hidden="true" />
            )}

            {pendingAction === "reject"
              ? "Declining CV changes"
              : "Decline all CV changes"}
          </Button>
        )}
      </div>

      {mode === "edit" && (
        <div className="bg-muted/30 mt-6 rounded-xl border p-4">
          <h4 className="font-medium">Edit proposal wording</h4>

          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Provide replacement text for every proposal under review. CareerOps
            will verify the edited wording before completing the review.
          </p>

          <div className="mt-5 space-y-5">
            {reviewableProposals.map((proposal, index) => {
              const fieldId = `proposal-edit-${proposal.id}`;

              return (
                <div key={proposal.id}>
                  <label htmlFor={fieldId} className="text-sm font-medium">
                    Proposal {index + 1}
                  </label>

                  <textarea
                    id={fieldId}
                    rows={5}
                    maxLength={REVIEW_EDIT_MAX_LENGTH}
                    value={editedTexts[proposal.id] ?? ""}
                    onChange={(event) =>
                      setEditedTexts((current) => ({
                        ...current,
                        [proposal.id]: event.target.value,
                      }))
                    }
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-3"
                  />

                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Maximum {REVIEW_EDIT_MAX_LENGTH.toLocaleString()}{" "}
                    characters.
                  </p>
                </div>
              );
            })}
          </div>

          {validationError !== null && (
            <p role="alert" className="text-destructive mt-4 text-sm">
              {validationError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={closeMode}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isPending}
              onClick={() => void submitEdits()}
            >
              {pendingAction === "edit" && (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              )}

              {pendingAction === "edit" ? "Saving edits" : "Submit edits"}
            </Button>
          </div>
        </div>
      )}

      {mode === "regenerate" && (
        <div className="bg-muted/30 mt-6 rounded-xl border p-4">
          <h4 className="font-medium">Regenerate proposal wording</h4>

          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Explain what should change. CareerOps will generate and verify a new
            proposal set, which will return here for another human review.
          </p>

          <label
            htmlFor="regeneration-feedback"
            className="mt-5 block text-sm font-medium"
          >
            Feedback for regeneration
          </label>

          <textarea
            id="regeneration-feedback"
            rows={4}
            maxLength={REVIEW_COMMENT_MAX_LENGTH}
            value={regenerationFeedback}
            onChange={(event) => setRegenerationFeedback(event.target.value)}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-3"
          />

          <p className="text-muted-foreground mt-1.5 text-xs">
            Maximum {REVIEW_COMMENT_MAX_LENGTH.toLocaleString()} characters.
          </p>

          {validationError !== null && (
            <p role="alert" className="text-destructive mt-4 text-sm">
              {validationError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={closeMode}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isPending}
              onClick={() => void submitRegeneration()}
            >
              {pendingAction === "regenerate" && (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              )}

              {pendingAction === "regenerate"
                ? "Requesting new proposals"
                : "Request new proposals"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
