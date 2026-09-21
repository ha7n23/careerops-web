import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { fetchApplicationMock, fetchApplicationsMock } = vi.hoisted(() => ({
  fetchApplicationMock: vi.fn(),
  fetchApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/browser-api", () => ({
  fetchApplication: fetchApplicationMock,
  fetchApplications: fetchApplicationsMock,
}));

import {
  useApplication,
  useApplications,
} from "@/features/applications/use-applications";

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
