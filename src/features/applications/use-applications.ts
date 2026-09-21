"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchApplication,
  fetchApplications,
} from "@/features/applications/browser-api";
import type { ApplicationStatus } from "@/features/applications/contracts";

export const applicationQueryKeys = {
  all: ["applications"] as const,
  list: (status?: ApplicationStatus) =>
    [...applicationQueryKeys.all, { status: status ?? "all" }] as const,
  detail: (applicationId: string) =>
    [...applicationQueryKeys.all, "detail", applicationId] as const,
};

export function useApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: applicationQueryKeys.list(status),
    queryFn: ({ signal }) => fetchApplications(status, signal),
  });
}

export function useApplication(applicationId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(applicationId),
    queryFn: ({ signal }) => fetchApplication(applicationId, signal),
  });
}
