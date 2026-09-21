import { describe, expect, it, vi } from "vitest";

import {
  ApplicationAnalysisUnavailableError,
  getApplicationAnalysisFromMcp,
  getApplicationFromMcp,
  createApplicationFromMcp,
  listApplicationsFromMcp,
} from "@/features/applications/mcp";

import {
  analysisApplicationId,
  applicationAnalysis,
  module2ApplicationAnalysis,
} from "@/test/application-analysis-fixtures";

const applicationResponse = {
  application_id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
  company_name: "Example Bank",
  role_title: "Graduate AI Engineer",
  status: "saved",
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-20T10:30:00Z",
};

describe("listApplicationsFromMcp", () => {
  it("calls Module 2 and returns validated applications", async () => {
    const callTool = vi.fn().mockResolvedValue({
      structuredContent: {
        applications: [applicationResponse],
        count: 1,
      },
    });

    await expect(
      listApplicationsFromMcp({ callTool }, "saved"),
    ).resolves.toEqual({
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
    });

    expect(callTool).toHaveBeenCalledWith({
      name: "list_applications",
      arguments: { status: "saved" },
    });
  });

  it("rejects a Module 2 tool error", async () => {
    const callTool = vi.fn().mockResolvedValue({ isError: true });

    await expect(listApplicationsFromMcp({ callTool })).rejects.toThrow(
      "Module 2 could not list applications",
    );
  });

  it("rejects a response without structured application data", async () => {
    const callTool = vi.fn().mockResolvedValue({ content: [] });

    await expect(listApplicationsFromMcp({ callTool })).rejects.toThrow(
      "Module 2 returned no structured application data",
    );
  });
});

describe("getApplicationFromMcp", () => {
  it("calls Module 2 and returns a validated application", async () => {
    const callTool = vi.fn().mockResolvedValue({
      structuredContent: applicationResponse,
    });

    await expect(
      getApplicationFromMcp(
        { callTool },
        "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      ),
    ).resolves.toEqual({
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:30:00Z",
    });

    expect(callTool).toHaveBeenCalledWith({
      name: "get_application",
      arguments: {
        application_id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      },
    });
  });

  it("rejects a Module 2 tool error", async () => {
    const callTool = vi.fn().mockResolvedValue({ isError: true });

    await expect(
      getApplicationFromMcp(
        { callTool },
        "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      ),
    ).rejects.toThrow("Module 2 could not get the application");
  });
});

describe("getApplicationAnalysisFromMcp", () => {
  it("calls Module 2 and returns validated analysis", async () => {
    const callTool = vi.fn().mockResolvedValue({
      structuredContent: module2ApplicationAnalysis,
    });

    await expect(
      getApplicationAnalysisFromMcp({ callTool }, analysisApplicationId),
    ).resolves.toEqual(applicationAnalysis);

    expect(callTool).toHaveBeenCalledWith({
      name: "get_application_analysis",
      arguments: {
        application_id: analysisApplicationId,
      },
    });
  });

  it("reports when an application has no available analysis", async () => {
    const callTool = vi.fn().mockResolvedValue({
      isError: true,
    });

    await expect(
      getApplicationAnalysisFromMcp({ callTool }, analysisApplicationId),
    ).rejects.toBeInstanceOf(ApplicationAnalysisUnavailableError);
  });
});

describe("createApplicationFromMcp", () => {
  it("calls Module 2 and returns the created application", async () => {
    const callTool = vi.fn().mockResolvedValue({
      structuredContent: applicationResponse,
    });

    await expect(
      createApplicationFromMcp(
        { callTool },
        {
          companyName: "Example Bank",
          roleTitle: "Graduate AI Engineer",
          idempotencyKey: "create-001",
        },
      ),
    ).resolves.toEqual({
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:30:00Z",
    });

    expect(callTool).toHaveBeenCalledWith({
      name: "create_application",
      arguments: {
        company_name: "Example Bank",
        role_title: "Graduate AI Engineer",
        idempotency_key: "create-001",
      },
    });
  });

  it("rejects a Module 2 tool error", async () => {
    const callTool = vi.fn().mockResolvedValue({
      isError: true,
    });

    await expect(
      createApplicationFromMcp(
        { callTool },
        {
          companyName: "Example Bank",
          roleTitle: "Graduate AI Engineer",
          idempotencyKey: "create-001",
        },
      ),
    ).rejects.toThrow("Module 2 could not create the application");
  });
});
