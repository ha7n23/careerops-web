"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeRegistryEvidenceLifecycle,
  createTextEvidence,
  fetchEvidenceDocuments,
  fetchEvidenceReview,
  fetchEvidenceReviews,
  fetchEvidenceRegistry,
  fetchRegistryEvidence,
  startEvidenceReview,
  submitEvidenceDecision,
  uploadEvidence,
  updateRegistryEvidence,
} from "@/features/evidence/browser-api";
import type {
  CreateTextEvidenceRequest,
  EvidenceRegistryEdit,
  EvidenceRegistryQuery,
  EvidenceReviewDecision,
} from "@/features/evidence/contracts";

export const evidenceQueryKeys = {
  all: ["evidence"] as const,
  documents: ["evidence", "documents"] as const,
  reviews: ["evidence", "reviews"] as const,
  review: (reviewRunId: string) =>
    ["evidence", "reviews", reviewRunId] as const,
  registryRoot: ["evidence", "registry"] as const,
  registry: (query: EvidenceRegistryQuery) =>
    ["evidence", "registry", query] as const,
  registryEvidence: (evidenceId: string) =>
    ["evidence", "registry-record", evidenceId] as const,
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

export function useEvidenceRegistry(query: EvidenceRegistryQuery) {
  return useQuery({
    queryKey: evidenceQueryKeys.registry(query),
    queryFn: ({ signal }) => fetchEvidenceRegistry(query, signal),
  });
}

export function useRegistryEvidence(evidenceId: string | null) {
  return useQuery({
    queryKey: evidenceQueryKeys.registryEvidence(evidenceId ?? "none"),
    queryFn: ({ signal }) => fetchRegistryEvidence(evidenceId ?? "", signal),
    enabled: evidenceId !== null,
  });
}

export function useUpdateRegistryEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evidenceId,
      edit,
    }: {
      evidenceId: string;
      edit: EvidenceRegistryEdit;
    }) => updateRegistryEvidence(evidenceId, edit),
    onSuccess: (evidence) => {
      queryClient.setQueryData(
        evidenceQueryKeys.registryEvidence(evidence.evidenceId),
        evidence,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: evidenceQueryKeys.registryRoot,
      });
    },
  });
}

export function useChangeRegistryEvidenceLifecycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evidenceId,
      action,
    }: {
      evidenceId: string;
      action: "archive" | "restore";
    }) => changeRegistryEvidenceLifecycle(evidenceId, action),
    onSuccess: (evidence) => {
      queryClient.setQueryData(
        evidenceQueryKeys.registryEvidence(evidence.evidenceId),
        evidence,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: evidenceQueryKeys.registryRoot,
      });
    },
  });
}
