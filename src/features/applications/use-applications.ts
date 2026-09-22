"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ApplicationsApiError,
  createApplication,
  fetchApplication,
  fetchApplicationAnalysis,
  fetchApplications,
  prepareApplication,
  reviewApplication,
} from "@/features/applications/browser-api";
import type { PrepareApplicationRequest } from "@/features/applications/analysis-contracts";
import type {
  ApplicationStatus,
  ApplicationSummary,
} from "@/features/applications/contracts";
import type { ReviewApplicationRequest } from "@/features/applications/review-contracts";

export const applicationQueryKeys = {
  all: ["applications"] as const,
  list: (status?: ApplicationStatus) =>
    [...applicationQueryKeys.all, { status: status ?? "all" }] as const,
  detail: (applicationId: string) =>
    [...applicationQueryKeys.all, "detail", applicationId] as const,
  analysis: (applicationId: string) =>
    [...applicationQueryKeys.detail(applicationId), "analysis"] as const,
};

export function useApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: applicationQueryKeys.list(status),
    queryFn: ({ signal }) => fetchApplications(status, signal),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: async (application) => {
      queryClient.setQueryData(
        applicationQueryKeys.detail(application.id),
        application,
      );

      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
    },
  });
}

type PrepareApplicationVariables = {
  applicationId: string;
  input: PrepareApplicationRequest;
};

export function usePrepareApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, input }: PrepareApplicationVariables) =>
      prepareApplication(applicationId, input),
    onMutate: async ({ applicationId }) => {
      const detailKey = applicationQueryKeys.detail(applicationId);

      await queryClient.cancelQueries({
        queryKey: detailKey,
      });

      queryClient.setQueryData<ApplicationSummary>(detailKey, (application) =>
        application === undefined
          ? undefined
          : {
              ...application,
              status: "preparing",
            },
      );
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        applicationQueryKeys.detail(result.application.id),
        result.application,
      );

      if (result.analysis !== null) {
        queryClient.setQueryData(
          applicationQueryKeys.analysis(result.application.id),
          {
            application: result.application,
            preparation: result.preparation,
            analysis: result.analysis,
          },
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
    },
  });
}

type ReviewApplicationVariables = {
  applicationId: string;
  input: ReviewApplicationRequest;
};

export function useReviewApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, input }: ReviewApplicationVariables) =>
      reviewApplication(applicationId, input),
    onSuccess: (result) => {
      queryClient.setQueryData(
        applicationQueryKeys.detail(result.application.id),
        result.application,
      );

      if (result.analysis !== null) {
        queryClient.setQueryData(
          applicationQueryKeys.analysis(result.application.id),
          {
            application: result.application,
            preparation: result.preparation,
            analysis: result.analysis,
          },
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
    },
  });
}

export function useApplication(applicationId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(applicationId),
    queryFn: ({ signal }) => fetchApplication(applicationId, signal),
  });
}

const ANALYSIS_POLL_INTERVAL_MS = 5_000;

export function useApplicationAnalysis(
  applicationId: string,
  pollWhilePreparing = false,
) {
  return useQuery({
    queryKey: applicationQueryKeys.analysis(applicationId),
    queryFn: ({ signal }) => fetchApplicationAnalysis(applicationId, signal),
    enabled: applicationId.length > 0,
    retry: false,
    refetchInterval: (query) => {
      const error = query.state.error;

      const analysisIsNotAvailable =
        error instanceof ApplicationsApiError &&
        error.code === "ANALYSIS_NOT_AVAILABLE";

      return pollWhilePreparing && analysisIsNotAvailable
        ? ANALYSIS_POLL_INTERVAL_MS
        : false;
    },
    refetchIntervalInBackground: false,
  });
}
