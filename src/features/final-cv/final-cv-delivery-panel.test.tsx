import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FinalCvDeliveryPanel } from "@/features/final-cv/final-cv-delivery-panel";
import { applicationAnalysisSchema } from "@/features/applications/analysis-contracts";
import { applicationAnalysis } from "@/test/application-analysis-fixtures";
import { finalCvVersion } from "@/test/final-cv-fixtures";

const { useEvidenceDocumentsMock, useGenerateFinalCvMock } = vi.hoisted(() => ({
  useEvidenceDocumentsMock: vi.fn(),
  useGenerateFinalCvMock: vi.fn(),
}));

vi.mock("@/features/evidence/use-evidence", () => ({
  useEvidenceDocuments: useEvidenceDocumentsMock,
}));

vi.mock("@/features/final-cv/use-final-cv", () => ({
  useGenerateFinalCv: useGenerateFinalCvMock,
}));

describe("FinalCvDeliveryPanel", () => {
  const generate = vi.fn();
  const analysis =
    applicationAnalysisSchema.parse(applicationAnalysis).analysis;

  beforeEach(() => {
    generate.mockReset();
    useEvidenceDocumentsMock.mockReset();
    useGenerateFinalCvMock.mockReset();
    useGenerateFinalCvMock.mockReturnValue({
      mutateAsync: generate,
      isPending: false,
      error: null,
    });
  });

  it("keeps delivery gated while proposals await review", () => {
    render(
      <FinalCvDeliveryPanel
        analysis={{
          ...analysis,
          status: "awaiting_review",
          reviewStatus: "pending",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Final CV awaits your decision" }),
    ).toBeInTheDocument();
    expect(useEvidenceDocumentsMock).not.toHaveBeenCalled();
  });

  it("shows the deterministic safety block for unsupported proposals", () => {
    render(
      <FinalCvDeliveryPanel
        analysis={{
          ...analysis,
          status: "completed",
          reviewStatus: null,
          blockedProposalIds: ["CVP-BLOCKED"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No final CV was created" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 unsupported proposal was excluded/i),
    ).toBeInTheDocument();
    expect(useEvidenceDocumentsMock).not.toHaveBeenCalled();
  });

  it("generates verified downloads from an approved source CV", async () => {
    const user = userEvent.setup();
    generate.mockResolvedValue(finalCvVersion);
    useEvidenceDocumentsMock.mockReturnValue({
      data: {
        items: [
          {
            documentId: "DOC-TEXT-001",
            originalFilename: "Notes",
            documentFormat: "text",
            sizeBytes: 100,
            status: "uploaded",
            uploadedAt: "2026-09-29T09:00:00Z",
            updatedAt: "2026-09-29T09:00:00Z",
          },
          {
            documentId: "DOC-CV-001",
            originalFilename: "careerops-cv.docx",
            documentFormat: "docx",
            sizeBytes: 12_288,
            status: "extracted",
            uploadedAt: "2026-09-29T09:00:00Z",
            updatedAt: "2026-09-29T09:01:00Z",
          },
        ],
        count: 2,
        limit: 20,
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(
      <FinalCvDeliveryPanel
        analysis={{
          ...analysis,
          status: "completed",
          reviewStatus: "approved",
        }}
      />,
    );

    expect(screen.getByLabelText("Source CV")).toHaveValue("DOC-CV-001");
    await user.click(screen.getByRole("button", { name: "Generate final CV" }));

    await waitFor(() => expect(generate).toHaveBeenCalledOnce());
    expect(generate).toHaveBeenCalledWith({
      threadId: "THR-001",
      sourceDocumentId: "DOC-CV-001",
    });

    expect(await screen.findByText("Final CV generated")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Download DOCX/i }),
    ).toHaveAttribute("href", "/api/cv-versions/CVV-001/artifacts/docx");
    expect(screen.getByRole("link", { name: /Download PDF/i })).toHaveAttribute(
      "href",
      "/api/cv-versions/CVV-001/artifacts/pdf",
    );
  });
});
