"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createApplication,
  fetchApplication,
  fetchApplicationAnalysis,
  fetchApplications,
} from "@/features/applications/browser-api";
import type { ApplicationStatus } from "@/features/applications/contracts";

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

export function useApplication(applicationId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(applicationId),
    queryFn: ({ signal }) => fetchApplication(applicationId, signal),
  });
}

export function useApplicationAnalysis(applicationId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.analysis(applicationId),
    queryFn: ({ signal }) => fetchApplicationAnalysis(applicationId, signal),
    retry: false,
  });
}
