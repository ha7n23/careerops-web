"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ApplicationReviewAction } from "@/features/applications/review-contracts";
import { useReviewApplication } from "@/features/applications/use-applications";

type ApplicationReviewControlsProps = {
  applicationId: string;
  reviewableProposalIds: string[];
  allowedReviewActions: ApplicationReviewAction[];
};

type SupportedReviewAction = "approve" | "reject";

type ReviewAttempt = {
  action: SupportedReviewAction;
  idempotencyKey: string;
};

export function ApplicationReviewControls({
  applicationId,
  reviewableProposalIds,
  allowedReviewActions,
}: ApplicationReviewControlsProps) {
  const [reviewAttempt, setReviewAttempt] = useState<ReviewAttempt | null>(
    null,
  );
  const { mutateAsync, isPending, error } = useReviewApplication();

  const canApprove = allowedReviewActions.includes("approve");
  const canReject = allowedReviewActions.includes("reject");

  if (!canApprove && !canReject) {
    return null;
  }

  async function submitReview(action: SupportedReviewAction) {
    const idempotencyKey =
      reviewAttempt?.action === action
        ? reviewAttempt.idempotencyKey
        : crypto.randomUUID();

    setReviewAttempt({ action, idempotencyKey });

    try {
      await mutateAsync({
        applicationId,
        input: {
          idempotencyKey,
          action,
          approvedProposalIds:
            action === "approve" ? reviewableProposalIds : [],
          rejectedProposalIds: action === "reject" ? reviewableProposalIds : [],
          edits: [],
          reviewerComment: null,
        },
      });

      setReviewAttempt(null);
    } catch {
      // React Query exposes the safe request error through `error` below.
    }
  }

  const pendingAction = isPending ? reviewAttempt?.action : undefined;

  return (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Review CV proposals</h3>

      <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
        Approving accepts all proposals currently marked for review. Rejecting
        declines those proposals. Neither action submits the job application to
        the employer.
      </p>

      {error !== null && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          The review outcome could not be confirmed. Check the latest
          application state before trying the same decision again.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {canApprove && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void submitReview("approve")}
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

        {canReject && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void submitReview("reject")}
          >
            {pendingAction === "reject" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <X aria-hidden="true" />
            )}

            {pendingAction === "reject"
              ? "Rejecting proposals"
              : "Reject all proposals"}
          </Button>
        )}
      </div>
    </div>
  );
}
