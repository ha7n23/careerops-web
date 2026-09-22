import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPendingActionsMock } = vi.hoisted(() => ({
  getPendingActionsMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  getPendingActions: getPendingActionsMock,
}));

import { GET } from "@/app/api/actions/pending/route";
import { pendingActions } from "@/test/pending-actions-fixtures";

describe("GET /api/actions/pending", () => {
  beforeEach(() => {
    getPendingActionsMock.mockReset();
  });

  it("returns pending actions without caching them", async () => {
    getPendingActionsMock.mockResolvedValue(pendingActions);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(pendingActions);
    expect(getPendingActionsMock).toHaveBeenCalledOnce();
  });

  it("returns a safe error when Module 2 is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPendingActionsMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await GET();

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "CareerOps services are temporarily unavailable.",
        },
      });
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
