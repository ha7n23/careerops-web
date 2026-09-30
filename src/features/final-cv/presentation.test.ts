import { describe, expect, it } from "vitest";

import { FinalCvApiError } from "@/features/final-cv/browser-api";
import { presentFinalCvError } from "@/features/final-cv/presentation";

describe("presentFinalCvError", () => {
  it("turns workflow conflicts into recovery guidance", () => {
    const result = presentFinalCvError(
      new FinalCvApiError("private contract detail", 409, "WORKFLOW_CONFLICT"),
    );

    expect(result.title).toBe("The CV workflow needs attention");
    expect(result.description).toMatch(/refresh the application/i);
    expect(result.description).not.toContain("private contract detail");
  });

  it("preserves the saved-review guarantee for gateway failures", () => {
    const result = presentFinalCvError(
      new FinalCvApiError("unavailable", 503, "SERVICE_UNAVAILABLE"),
    );

    expect(result.title).toBe("Document generation is temporarily unavailable");
    expect(result.description).toMatch(/approved review is still saved/i);
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(presentFinalCvError(new Error("secret"))).toEqual({
      title: "The final CV could not be confirmed",
      description:
        "No application was submitted and no download should be assumed complete. Refresh the workflow before retrying safely.",
    });
  });
});
