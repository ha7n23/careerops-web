import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { fetchApplicationsMock } = vi.hoisted(() => ({
  fetchApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/browser-api", () => ({
  fetchApplications: fetchApplicationsMock,
}));

import { useApplications } from "@/features/applications/use-applications";

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
