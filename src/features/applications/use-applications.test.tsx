import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const {
  createApplicationMock,
  fetchApplicationAnalysisMock,
  fetchApplicationMock,
  fetchApplicationsMock,
} = vi.hoisted(() => ({
  createApplicationMock: vi.fn(),
  fetchApplicationAnalysisMock: vi.fn(),
  fetchApplicationMock: vi.fn(),
  fetchApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/browser-api", () => ({
  createApplication: createApplicationMock,
  fetchApplication: fetchApplicationMock,
  fetchApplicationAnalysis: fetchApplicationAnalysisMock,
  fetchApplications: fetchApplicationsMock,
}));

import {
  applicationQueryKeys,
  useApplication,
  useApplicationAnalysis,
  useApplications,
  useCreateApplication,
} from "@/features/applications/use-applications";

import {
  analysisApplicationId,
  applicationAnalysis,
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
