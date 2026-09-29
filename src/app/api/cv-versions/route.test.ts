import { beforeEach, describe, expect, it, vi } from "vitest";

import { finalCvVersion } from "@/test/final-cv-fixtures";

const { generateFinalCvMock } = vi.hoisted(() => ({
  generateFinalCvMock: vi.fn(),
}));

vi.mock("@/features/final-cv/server", () => ({
  generateFinalCv: generateFinalCvMock,
}));

import { POST } from "@/app/api/cv-versions/route";

describe("POST /api/cv-versions", () => {
  beforeEach(() => {
    generateFinalCvMock.mockReset();
  });

  it("generates a verified CV through Module 2", async () => {
    generateFinalCvMock.mockResolvedValue(finalCvVersion);

    const response = await POST(
      new Request("http://localhost/api/cv-versions", {
        method: "POST",
        body: JSON.stringify({
          threadId: "THR-001",
          sourceDocumentId: "DOC-CV-001",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(generateFinalCvMock).toHaveBeenCalledWith({
      threadId: "THR-001",
      sourceDocumentId: "DOC-CV-001",
    });
  });

  it("returns 200 when Module 2 reuses an existing version", async () => {
    generateFinalCvMock.mockResolvedValue({
      ...finalCvVersion,
      reusedExistingVersion: true,
    });

    const response = await POST(
      new Request("http://localhost/api/cv-versions", {
        method: "POST",
        body: JSON.stringify({
          threadId: "THR-001",
          sourceDocumentId: "DOC-CV-001",
        }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects invalid input before calling Module 2", async () => {
    const response = await POST(
      new Request("http://localhost/api/cv-versions", {
        method: "POST",
        body: JSON.stringify({ threadId: "", sourceDocumentId: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(generateFinalCvMock).not.toHaveBeenCalled();
  });
});
