"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTextEvidence,
  fetchEvidenceDocuments,
  fetchEvidenceReview,
  fetchEvidenceReviews,
  startEvidenceReview,
  submitEvidenceDecision,
  uploadEvidence,
} from "@/features/evidence/browser-api";
import type {
  CreateTextEvidenceRequest,
  EvidenceReviewDecision,
} from "@/features/evidence/contracts";

export const evidenceQueryKeys = {
  all: ["evidence"] as const,
  documents: ["evidence", "documents"] as const,
  reviews: ["evidence", "reviews"] as const,
  review: (reviewRunId: string) =>
    ["evidence", "reviews", reviewRunId] as const,
};

export function useEvidenceDocuments() {
  return useQuery({
    queryKey: evidenceQueryKeys.documents,
    queryFn: ({ signal }) => fetchEvidenceDocuments(signal),
  });
}

export function useEvidenceReviews() {
  return useQuery({
    queryKey: evidenceQueryKeys.reviews,
    queryFn: ({ signal }) => fetchEvidenceReviews(signal),
  });
}

export function useEvidenceReview(reviewRunId: string | null) {
  return useQuery({
    queryKey: evidenceQueryKeys.review(reviewRunId ?? "none"),
    queryFn: ({ signal }) => fetchEvidenceReview(reviewRunId ?? "", signal),
    enabled: reviewRunId !== null,
  });
}

type EvidenceIntakeInput =
  | { kind: "text"; input: CreateTextEvidenceRequest }
  | { kind: "file"; file: File }
  | { kind: "existing"; documentId: string };

export function useStartEvidenceIntake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EvidenceIntakeInput) => {
      const documentId =
        input.kind === "existing"
          ? input.documentId
          : input.kind === "file"
            ? (await uploadEvidence(input.file)).documentId
            : (await createTextEvidence(input.input)).documentId;

      return startEvidenceReview(documentId);
    },
    onSuccess: (review) => {
      queryClient.setQueryData(
        evidenceQueryKeys.review(review.reviewRunId),
        review,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys.documents,
        }),
        queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys.reviews,
        }),
      ]);
    },
  });
}

export function useSubmitEvidenceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewRunId,
      decision,
    }: {
      reviewRunId: string;
      decision: EvidenceReviewDecision;
    }) => submitEvidenceDecision(reviewRunId, decision),
    onSuccess: (review) => {
      queryClient.setQueryData(
        evidenceQueryKeys.review(review.reviewRunId),
        review,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys.documents,
        }),
        queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys.reviews,
        }),
      ]);
    },
  });
}
