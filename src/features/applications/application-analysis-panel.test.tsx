import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationsApiError } from "@/features/applications/browser-api";
import {
  analysisApplicationId,
  applicationAnalysis,
} from "@/test/application-analysis-fixtures";

const {
  useApplicationAnalysisMock,
  useApplicationMock,
  useReviewApplicationMock,
} = vi.hoisted(() => ({
  useApplicationAnalysisMock: vi.fn(),
  useApplicationMock: vi.fn(),
  useReviewApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  useApplication: useApplicationMock,
  useApplicationAnalysis: useApplicationAnalysisMock,
  useReviewApplication: useReviewApplicationMock,
}));

import { ApplicationAnalysisPanel } from "@/features/applications/application-analysis-panel";

describe("ApplicationAnalysisPanel", () => {
  beforeEach(() => {
    useApplicationMock.mockReset();
    useApplicationAnalysisMock.mockReset();
    useReviewApplicationMock.mockReset();

    useApplicationMock.mockReturnValue({
      data: applicationAnalysis.application,
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    useReviewApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      variables: undefined,
    });
  });

  it("shows a loading state while analysis is requested", () => {
    useApplicationAnalysisMock.mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: true,
      refetch: vi.fn(),
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(
      screen.getByRole("status", {
        name: "Loading application analysis",
      }),
    ).toBeInTheDocument();
  });

  it("shows a normal unavailable state when no analysis exists", () => {
    useApplicationAnalysisMock.mockReturnValue({
      data: undefined,
      error: new ApplicationsApiError(
        "This application does not have an available analysis yet.",
        404,
        "ANALYSIS_NOT_AVAILABLE",
      ),
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(
      screen.getByRole("heading", {
        name: "No application analysis yet",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    expect(useApplicationAnalysisMock).toHaveBeenCalledWith(
      analysisApplicationId,
      false,
    );
  });

  it("shows preparation progress and enables polling while preparing", () => {
    useApplicationMock.mockReturnValue({
      data: {
        ...applicationAnalysis.application,
        status: "preparing",
      },
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    useApplicationAnalysisMock.mockReturnValue({
      data: undefined,
      error: new ApplicationsApiError(
        "This application does not have an available analysis yet.",
        404,
        "ANALYSIS_NOT_AVAILABLE",
      ),
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(
      screen.getByRole("heading", {
        name: "Preparation in progress",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/this page will update automatically/i),
    ).toBeInTheDocument();

    expect(useApplicationAnalysisMock).toHaveBeenCalledWith(
      analysisApplicationId,
      true,
    );

    expect(
      screen.queryByRole("heading", {
        name: "No application analysis yet",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state and retries unexpected failures", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    useApplicationAnalysisMock.mockReturnValue({
      data: undefined,
      error: new ApplicationsApiError(
        "CareerOps services are temporarily unavailable.",
        502,
        "UPSTREAM_UNAVAILABLE",
      ),
      isPending: false,
      isFetching: false,
      refetch,
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Analysis could not be loaded",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders fit, evidence, and CV proposals", () => {
    useApplicationAnalysisMock.mockReturnValue({
      data: applicationAnalysis,
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(
      screen.getByRole("heading", {
        name: "Application analysis",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Overall fit: 82 percent")).toHaveTextContent(
      "82%",
    );

    expect(screen.getByText("Build production AI systems")).toBeInTheDocument();

    expect(screen.getByText("Strong match")).toBeInTheDocument();

    expect(
      screen.getByText("Delivered a production retrieval system."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Built a production retrieval system."),
    ).toBeInTheDocument();
  });

  it("renders review controls for reviewable proposals", () => {
    useApplicationAnalysisMock.mockReturnValue({
      data: {
        ...applicationAnalysis,
        analysis: {
          ...applicationAnalysis.analysis,
          status: "awaiting_review",
          reviewableProposalIds: ["CVP-001"],
          allowedReviewActions: ["approve", "reject"],
        },
      },
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ApplicationAnalysisPanel applicationId={analysisApplicationId} />);

    expect(
      screen.getByRole("heading", { name: "Review CV proposals" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Approve all proposals" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Decline all CV changes" }),
    ).toBeInTheDocument();
  });
});
