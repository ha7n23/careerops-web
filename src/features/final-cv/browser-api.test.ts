import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchFinalCv,
  FinalCvApiError,
  generateFinalCv,
} from "@/features/final-cv/browser-api";
import { finalCvMetadata, finalCvVersion } from "@/test/final-cv-fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("final CV browser API", () => {
  it("generates a version through the internal BFF", async () => {
    const input = {
      threadId: "THR-001",
      sourceDocumentId: "DOC-CV-001",
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(finalCvVersion));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateFinalCv(input)).resolves.toEqual(finalCvVersion);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/cv-versions");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify(input));
    expect(new Headers(options.headers).get("Accept")).toBe("application/json");
    expect(new Headers(options.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("retrieves version metadata", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(Response.json(finalCvMetadata));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchFinalCv("CVV-001", controller.signal)).resolves.toEqual(
      finalCvMetadata,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/cv-versions/CVV-001");
    expect(options.signal).toBe(controller.signal);
    expect(new Headers(options.headers).get("Accept")).toBe("application/json");
  });

  it("preserves a safe generation conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "WORKFLOW_CONFLICT",
              message: "The CV review is not approved.",
            },
          },
          { status: 409 },
        ),
      ),
    );

    await expect(
      generateFinalCv({
        threadId: "THR-001",
        sourceDocumentId: "DOC-CV-001",
      }),
    ).rejects.toMatchObject({
      name: "FinalCvApiError",
      code: "WORKFLOW_CONFLICT",
      status: 409,
    } satisfies Partial<FinalCvApiError>);
  });
});
