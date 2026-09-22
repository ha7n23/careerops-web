import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApplicationsApiError,
  createApplication,
  fetchApplication,
  fetchApplicationAnalysis,
  fetchApplications,
  fetchPendingActions,
  prepareApplication,
  reviewApplication,
} from "@/features/applications/browser-api";

import {
  analysisApplicationId,
  applicationAnalysis,
  prepareApplicationResult,
  reviewApplicationResult,
} from "@/test/application-analysis-fixtures";

import { pendingActions } from "@/test/pending-actions-fixtures";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchApplications", () => {
  it("requests and validates applications from the internal API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(applicationList, {
        status: 200,
      }),
    );
    const controller = new AbortController();

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchApplications("saved", controller.signal),
    ).resolves.toEqual(applicationList);

    expect(fetchMock).toHaveBeenCalledWith("/api/applications?status=saved", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  });

  it("preserves a safe error returned by the API route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "UPSTREAM_UNAVAILABLE",
              message: "CareerOps services are temporarily unavailable.",
            },
          },
          { status: 502 },
        ),
      ),
    );

    await expect(fetchApplications()).rejects.toMatchObject({
      name: "ApplicationsApiError",
      status: 502,
      code: "UPSTREAM_UNAVAILABLE",
      message: "CareerOps services are temporarily unavailable.",
    } satisfies Partial<ApplicationsApiError>);
  });

  it("rejects a successful response with an invalid contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ applications: [], count: 1 }, { status: 200 }),
        ),
    );

    await expect(fetchApplications()).rejects.toMatchObject({
      status: 200,
      code: "INVALID_RESPONSE",
      message: "CareerOps returned an invalid response.",
    });
  });
});

describe("fetchApplication", () => {
  it("requests and validates one application from the internal API", async () => {
    const application = applicationList.applications[0];
    const fetchMock = vi.fn().mockResolvedValue(Response.json(application));
    const controller = new AbortController();

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchApplication(application.id, controller.signal),
    ).resolves.toEqual(application);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/applications/${application.id}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
  });
});

describe("fetchApplicationAnalysis", () => {
  it("requests and validates persisted analysis from the internal API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(applicationAnalysis));
    const controller = new AbortController();

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchApplicationAnalysis(analysisApplicationId, controller.signal),
    ).resolves.toEqual(applicationAnalysis);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/applications/${analysisApplicationId}/analysis`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
  });
});

describe("fetchPendingActions", () => {
  it("requests and validates pending actions from the internal API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(pendingActions));
    const controller = new AbortController();

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPendingActions(controller.signal)).resolves.toEqual(
      pendingActions,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/actions/pending", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  });
});

describe("createApplication", () => {
  it("posts and validates a new application", async () => {
    const application = applicationList.applications[0];
    const input = {
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      idempotencyKey: "create-001",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(application, {
        status: 201,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(createApplication(input)).resolves.toEqual(application);

    expect(fetchMock).toHaveBeenCalledWith("/api/applications", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: undefined,
    });
  });
});

describe("prepareApplication", () => {
  it("posts and validates an application preparation", async () => {
    const input = {
      jobDescription: "Strong Python skills are essential.",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(prepareApplicationResult));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      prepareApplication(analysisApplicationId, input),
    ).resolves.toEqual(prepareApplicationResult);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/applications/${analysisApplicationId}/prepare`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: undefined,
      },
    );
  });
});

describe("reviewApplication", () => {
  it("posts and validates an application review", async () => {
    const input = {
      idempotencyKey: "review-001",
      action: "approve" as const,
      approvedProposalIds: ["CVP-001"],
      rejectedProposalIds: [],
      edits: [],
      reviewerComment: null,
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(reviewApplicationResult));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      reviewApplication(analysisApplicationId, input),
    ).resolves.toEqual(reviewApplicationResult);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/applications/${analysisApplicationId}/review`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: undefined,
      },
    );
  });
});
