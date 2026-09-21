import { beforeEach, describe, expect, it, vi } from "vitest";

const { listApplicationsMock } = vi.hoisted(() => ({
  listApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  listApplications: listApplicationsMock,
}));

import { GET } from "@/app/api/applications/route";

describe("GET /api/applications", () => {
  beforeEach(() => {
    listApplicationsMock.mockReset();
  });

  it("returns applications using an optional status filter", async () => {
    const applicationList = {
      applications: [
        {
          id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
          companyName: "Example Bank",
          roleTitle: "Graduate AI Engineer",
          status: "saved",
          createdAt: "2026-09-20T10:00:00Z",
          updatedAt: "2026-09-20T10:30:00Z",
        },
      ],
      count: 1,
    };

    listApplicationsMock.mockResolvedValue(applicationList);

    const response = await GET(
      new Request("http://localhost/api/applications?status=saved"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(applicationList);
    expect(listApplicationsMock).toHaveBeenCalledWith("saved");
  });

  it("rejects an unsupported status before calling Module 2", async () => {
    const response = await GET(
      new Request("http://localhost/api/applications?status=draft"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_STATUS",
        message: "The requested application status is not supported.",
      },
    });
    expect(listApplicationsMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when Module 2 is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    listApplicationsMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await GET(
        new Request("http://localhost/api/applications"),
      );

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
