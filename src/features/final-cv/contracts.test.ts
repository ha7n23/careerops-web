import { describe, expect, it } from "vitest";

import {
  module2CvVersionMetadataSchema,
  module2FinalCvVersionSchema,
} from "@/features/final-cv/contracts";
import {
  finalCvMetadata,
  finalCvVersion,
  module2FinalCvVersion,
} from "@/test/final-cv-fixtures";

describe("final CV contracts", () => {
  it("normalizes a generated Module 2 CV version", () => {
    expect(module2FinalCvVersionSchema.parse(module2FinalCvVersion)).toEqual(
      finalCvVersion,
    );
  });

  it("normalizes retrieved metadata without generation-only state", () => {
    const { reused_existing_version: _reused, ...metadata } =
      module2FinalCvVersion;

    expect(_reused).toBe(false);

    expect(module2CvVersionMetadataSchema.parse(metadata)).toEqual(
      finalCvMetadata,
    );
  });

  it("rejects an unverified artifact format", () => {
    expect(() =>
      module2FinalCvVersionSchema.parse({
        ...module2FinalCvVersion,
        artifacts: [
          {
            ...module2FinalCvVersion.artifacts[0],
            artifact_format: "html",
          },
        ],
      }),
    ).toThrow();
  });
});
