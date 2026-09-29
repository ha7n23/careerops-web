import { beforeEach, describe, expect, it, vi } from "vitest";

const { downloadFinalCvArtifactMock } = vi.hoisted(() => ({
  downloadFinalCvArtifactMock: vi.fn(),
}));

vi.mock("@/features/final-cv/server", () => ({
  downloadFinalCvArtifact: downloadFinalCvArtifactMock,
}));

import { GET } from "@/app/api/cv-versions/[cvVersionId]/artifacts/[artifactFormat]/route";

describe("GET /api/cv-versions/[cvVersionId]/artifacts/[artifactFormat]", () => {
  beforeEach(() => {
    downloadFinalCvArtifactMock.mockReset();
  });

  it("proxies a verified PDF with browser-safe headers", async () => {
    downloadFinalCvArtifactMock.mockResolvedValue({
      data: new TextEncoder().encode("%PDF-careerops").buffer,
      mediaType: "application/pdf",
    });

    const response = await GET(
      new Request("http://localhost/api/cv-versions/CVV-001/artifacts/pdf"),
      {
        params: Promise.resolve({
          cvVersionId: "CVV-001",
          artifactFormat: "pdf",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="careerops-cv-CVV-001.pdf"',
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).toBe("%PDF-careerops");
  });

  it("rejects unsupported download formats", async () => {
    const response = await GET(
      new Request("http://localhost/api/cv-versions/CVV-001/artifacts/html"),
      {
        params: Promise.resolve({
          cvVersionId: "CVV-001",
          artifactFormat: "html",
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(downloadFinalCvArtifactMock).not.toHaveBeenCalled();
  });
});
