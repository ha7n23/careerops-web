import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApplicationMock, listApplicationsMock } = vi.hoisted(() => ({
  createApplicationMock: vi.fn(),
  listApplicationsMock: vi.fn(),
}));

vi.mock("@/features/applications/server", () => ({
  createApplication: createApplicationMock,
  listApplications: listApplicationsMock,
}));

import { GET, POST } from "@/app/api/applications/route";

describe("GET /api/applications", () => {
  beforeEach(() => {
    createApplicationMock.mockReset();
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

describe("POST /api/applications", () => {
  beforeEach(() => {
    createApplicationMock.mockReset();
    listApplicationsMock.mockReset();
  });

  it("creates and returns a saved application", async () => {
    const application = {
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:00:00Z",
    };

    createApplicationMock.mockResolvedValue(application);

    const response = await POST(
      new Request("http://localhost/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: " Example Bank ",
          roleTitle: " Graduate AI Engineer ",
          idempotencyKey: "create-001",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    expect(response.headers.get("Location")).toBe(
      `/api/applications/${application.id}`,
    );

    await expect(response.json()).resolves.toEqual(application);

    expect(createApplicationMock).toHaveBeenCalledWith({
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      idempotencyKey: "create-001",
    });
  });

  it("rejects invalid input before calling Module 2", async () => {
    const response = await POST(
      new Request("http://localhost/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: "   ",
          roleTitle: "Graduate AI Engineer",
          idempotencyKey: "create-001",
        }),
      }),
    );

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_APPLICATION_INPUT",
        message: "Enter a valid company name and role title.",
      },
    });

    expect(createApplicationMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when Module 2 is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    createApplicationMock.mockRejectedValue(
      new Error("Sensitive upstream failure details"),
    );

    try {
      const response = await POST(
        new Request("http://localhost/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: "Example Bank",
            roleTitle: "Graduate AI Engineer",
            idempotencyKey: "create-001",
          }),
        }),
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
