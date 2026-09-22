import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const {
  createApplicationMock,
  fetchApplicationAnalysisMock,
  fetchApplicationMock,
  fetchApplicationsMock,
  prepareApplicationMock,
  reviewApplicationMock,
} = vi.hoisted(() => ({
  createApplicationMock: vi.fn(),
  fetchApplicationAnalysisMock: vi.fn(),
  fetchApplicationMock: vi.fn(),
  fetchApplicationsMock: vi.fn(),
  prepareApplicationMock: vi.fn(),
  reviewApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/browser-api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/applications/browser-api")
  >("@/features/applications/browser-api");

  return {
    ...actual,
    createApplication: createApplicationMock,
    fetchApplication: fetchApplicationMock,
    fetchApplicationAnalysis: fetchApplicationAnalysisMock,
    fetchApplications: fetchApplicationsMock,
    prepareApplication: prepareApplicationMock,
    reviewApplication: reviewApplicationMock,
  };
});

import {
  applicationQueryKeys,
  useApplication,
  useApplicationAnalysis,
  useApplications,
  useCreateApplication,
  usePrepareApplication,
  useReviewApplication,
} from "@/features/applications/use-applications";

import {
  analysisApplicationId,
  applicationAnalysis,
  prepareApplicationResult,
  reviewApplicationResult,
} from "@/test/application-analysis-fixtures";

describe("useApplications", () => {
  it("loads applications through React Query", async () => {
    const applicationList = { applications: [], count: 0 };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    fetchApplicationsMock.mockResolvedValue(applicationList);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useApplications("saved"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(applicationList);
    expect(fetchApplicationsMock).toHaveBeenCalledWith(
      "saved",
      expect.any(AbortSignal),
    );
  });
});

describe("useApplication", () => {
  it("loads one application through React Query", async () => {
    const application = {
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:30:00Z",
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    fetchApplicationMock.mockResolvedValue(application);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useApplication(application.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(application);
    expect(fetchApplicationMock).toHaveBeenCalledWith(
      application.id,
      expect.any(AbortSignal),
    );
  });
});

describe("useCreateApplication", () => {
  it("creates an application and refreshes application queries", async () => {
    const application = {
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:00:00Z",
    };
    const input = {
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      idempotencyKey: "create-001",
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    createApplicationMock.mockResolvedValue(application);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useCreateApplication(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(createApplicationMock.mock.calls[0][0]).toEqual(input);
    expect(
      queryClient.getQueryData(applicationQueryKeys.detail(application.id)),
    ).toEqual(application);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: applicationQueryKeys.all,
    });
  });
});

describe("useApplicationAnalysis", () => {
  it("loads persisted analysis through React Query", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    fetchApplicationAnalysisMock.mockResolvedValue(applicationAnalysis);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useApplicationAnalysis(analysisApplicationId),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(applicationAnalysis);
    expect(fetchApplicationAnalysisMock).toHaveBeenCalledWith(
      analysisApplicationId,
      expect.any(AbortSignal),
    );
  });
});

describe("usePrepareApplication", () => {
  it("prepares an application and refreshes application queries", async () => {
    const input = {
      jobDescription: "Strong Python skills are essential.",
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    prepareApplicationMock.mockResolvedValue(prepareApplicationResult);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => usePrepareApplication(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        applicationId: analysisApplicationId,
        input,
      });
    });

    expect(prepareApplicationMock.mock.calls[0][0]).toBe(analysisApplicationId);
    expect(prepareApplicationMock.mock.calls[0][1]).toEqual(input);
    expect(
      queryClient.getQueryData(
        applicationQueryKeys.detail(analysisApplicationId),
      ),
    ).toEqual(prepareApplicationResult.application);
    expect(
      queryClient.getQueryData(
        applicationQueryKeys.analysis(analysisApplicationId),
      ),
    ).toEqual(applicationAnalysis);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: applicationQueryKeys.all,
    });
  });

  it("marks the application as preparing while the request is pending", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const savedApplication = {
      ...prepareApplicationResult.application,
      status: "saved" as const,
    };

    queryClient.setQueryData(
      applicationQueryKeys.detail(analysisApplicationId),
      savedApplication,
    );

    let resolvePreparation:
      ((value: typeof prepareApplicationResult) => void) | undefined;

    const pendingPreparation = new Promise<typeof prepareApplicationResult>(
      (resolve) => {
        resolvePreparation = resolve;
      },
    );

    prepareApplicationMock.mockReturnValue(pendingPreparation);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => usePrepareApplication(), {
      wrapper: Wrapper,
    });

    let mutationPromise: Promise<unknown> | undefined;

    act(() => {
      mutationPromise = result.current.mutateAsync({
        applicationId: analysisApplicationId,
        input: {
          jobDescription:
            "Build and maintain Python services for an AI engineering team.",
        },
      });
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData(
          applicationQueryKeys.detail(analysisApplicationId),
        ),
      ).toMatchObject({
        status: "preparing",
      });
    });

    await act(async () => {
      resolvePreparation?.(prepareApplicationResult);
      await mutationPromise;
    });

    expect(
      queryClient.getQueryData(
        applicationQueryKeys.detail(analysisApplicationId),
      ),
    ).toEqual(prepareApplicationResult.application);
  });
});

describe("useReviewApplication", () => {
  it("reviews an application and refreshes cached application data", async () => {
    const input = {
      idempotencyKey: "review-001",
      action: "approve" as const,
      approvedProposalIds: ["CVP-001"],
      rejectedProposalIds: [],
      edits: [],
      reviewerComment: null,
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    reviewApplicationMock.mockResolvedValue(reviewApplicationResult);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useReviewApplication(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        applicationId: analysisApplicationId,
        input,
      });
    });

    expect(reviewApplicationMock).toHaveBeenCalledWith(
      analysisApplicationId,
      input,
    );

    expect(
      queryClient.getQueryData(
        applicationQueryKeys.detail(analysisApplicationId),
      ),
    ).toEqual(reviewApplicationResult.application);

    expect(
      queryClient.getQueryData(
        applicationQueryKeys.analysis(analysisApplicationId),
      ),
    ).toEqual({
      application: reviewApplicationResult.application,
      preparation: reviewApplicationResult.preparation,
      analysis: reviewApplicationResult.analysis,
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: applicationQueryKeys.all,
    });
  });
});
