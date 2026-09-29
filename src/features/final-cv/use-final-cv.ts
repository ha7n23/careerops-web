"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchFinalCv, generateFinalCv } from "@/features/final-cv/browser-api";
import type { GenerateFinalCvRequest } from "@/features/final-cv/contracts";

export const finalCvQueryKeys = {
  all: ["final-cv"] as const,
  version: (cvVersionId: string) =>
    ["final-cv", "version", cvVersionId] as const,
};

export function useFinalCv(cvVersionId: string | null) {
  return useQuery({
    queryKey: finalCvQueryKeys.version(cvVersionId ?? "none"),
    queryFn: ({ signal }) => fetchFinalCv(cvVersionId ?? "", signal),
    enabled: cvVersionId !== null,
  });
}

export function useGenerateFinalCv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateFinalCvRequest) => generateFinalCv(input),
    onSuccess: (version) => {
      queryClient.setQueryData(
        finalCvQueryKeys.version(version.cvVersionId),
        version,
      );
    },
  });
}
