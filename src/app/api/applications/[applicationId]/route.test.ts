import { beforeEach, describe, expect, it, vi } from "vitest";

const { getApplicationMock } = vi.hoisted(() => ({
  getApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  getApplication: getApplicationMock,
}));

import { GET } from "@/app/api/applications/[applicationId]/route";

const applicationId = "9b52d879-79b6-4af4-a369-886b77f4bb6e";

function routeContext(id: string) {
  return {
    params: Promise.resolve({ applicationId: id }),
  };
}

describe("GET /api/applications/[applicationId]", () => {
  beforeEach(() => {
    getApplicationMock.mockReset();
  });

  it("returns one application", async () => {
    const application = {
      id: applicationId,
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:30:00Z",
    };

    getApplicationMock.mockResolvedValue(application);

    const response = await GET(
      new Request(`http://localhost/api/applications/${applicationId}`),
      routeContext(applicationId),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(application);
    expect(getApplicationMock).toHaveBeenCalledWith(applicationId);
  });

  it("rejects an invalid application ID before calling Module 2", async () => {
    const response = await GET(
      new Request("http://localhost/api/applications/not-a-uuid"),
      routeContext("not-a-uuid"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_APPLICATION_ID",
        message: "The requested application ID is invalid.",
      },
    });
    expect(getApplicationMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when Module 2 is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getApplicationMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await GET(
        new Request(`http://localhost/api/applications/${applicationId}`),
        routeContext(applicationId),
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
