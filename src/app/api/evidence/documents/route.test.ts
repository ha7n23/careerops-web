import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  evidenceDocument,
  evidenceDocumentHistory,
} from "@/test/evidence-fixtures";

const {
  createTextEvidenceSourceMock,
  listEvidenceDocumentsMock,
  uploadEvidenceDocumentMock,
} = vi.hoisted(() => ({
  createTextEvidenceSourceMock: vi.fn(),
  listEvidenceDocumentsMock: vi.fn(),
  uploadEvidenceDocumentMock: vi.fn(),
}));

vi.mock("@/features/evidence/server", () => ({
  createTextEvidenceSource: createTextEvidenceSourceMock,
  listEvidenceDocuments: listEvidenceDocumentsMock,
  uploadEvidenceDocument: uploadEvidenceDocumentMock,
}));

import { GET, POST } from "@/app/api/evidence/documents/route";

describe("/api/evidence/documents", () => {
  beforeEach(() => {
    createTextEvidenceSourceMock.mockReset();
    listEvidenceDocumentsMock.mockReset();
    uploadEvidenceDocumentMock.mockReset();
  });

  it("lists durable evidence sources", async () => {
    listEvidenceDocumentsMock.mockResolvedValue(evidenceDocumentHistory);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual(evidenceDocumentHistory);
  });

  it("creates a validated pasted-text source", async () => {
    createTextEvidenceSourceMock.mockResolvedValue(evidenceDocument);

    const response = await POST(
      new Request("http://localhost/api/evidence/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: " CareerOps notes ",
          content: " Built a FastAPI service. ",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createTextEvidenceSourceMock).toHaveBeenCalledWith({
      title: "CareerOps notes",
      content: "Built a FastAPI service.",
    });
  });

  it("uploads a bounded PDF source", async () => {
    const document = {
      ...evidenceDocument,
      originalFilename: "candidate.pdf",
      documentFormat: "pdf" as const,
      mediaType: "application/pdf",
    };
    uploadEvidenceDocumentMock.mockResolvedValue(document);
    const formData = new FormData();
    formData.set(
      "file",
      new File(["%PDF-test"], "candidate.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(createMultipartRequest(formData));

    expect(response.status).toBe(201);
    expect(uploadEvidenceDocumentMock).toHaveBeenCalledOnce();
  });

  it("rejects unsupported uploads before calling Module 2", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["plain text"], "notes.txt", { type: "text/plain" }),
    );

    const response = await POST(createMultipartRequest(formData));

    expect(response.status).toBe(400);
    expect(uploadEvidenceDocumentMock).not.toHaveBeenCalled();
  });
});

function createMultipartRequest(formData: FormData): Request {
  return {
    headers: new Headers({
      "content-type": "multipart/form-data; boundary=test-boundary",
    }),
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as Request;
}
