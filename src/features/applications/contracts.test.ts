import { describe, expect, it } from "vitest";

import {
  applicationListSchema,
  module2ApplicationListSchema,
  module2ApplicationSummarySchema,
} from "@/features/applications/contracts";
import { module2ApplicationAnalysisSchema } from "@/features/applications/analysis-contracts";
import {
  applicationAnalysis,
  module2ApplicationAnalysis,
} from "@/test/application-analysis-fixtures";

const applicationResponse = {
  application_id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
  company_name: "Example Bank",
  role_title: "Graduate AI Engineer",
  status: "saved",
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-20T10:30:00+00:00",
};

describe("application contracts", () => {
  it("validates and converts a Module 2 application summary", () => {
    expect(module2ApplicationSummarySchema.parse(applicationResponse)).toEqual({
      id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
      status: "saved",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:30:00+00:00",
    });
  });

  it("rejects a status that Module 2 does not support", () => {
    expect(() =>
      module2ApplicationSummarySchema.parse({
        ...applicationResponse,
        status: "draft",
      }),
    ).toThrow();
  });

  it("rejects an inconsistent application count", () => {
    expect(() =>
      module2ApplicationListSchema.parse({
        applications: [applicationResponse],
        count: 2,
      }),
    ).toThrow("Application count does not match");
  });

  it("validates the camel-case application list returned to the browser", () => {
    const applicationList = {
      applications: [
        {
          id: applicationResponse.application_id,
          companyName: applicationResponse.company_name,
          roleTitle: applicationResponse.role_title,
          status: applicationResponse.status,
          createdAt: applicationResponse.created_at,
          updatedAt: applicationResponse.updated_at,
        },
      ],
      count: 1,
    };

    expect(applicationListSchema.parse(applicationList)).toEqual(
      applicationList,
    );
  });
  it("validates and converts Module 2 application analysis", () => {
    expect(
      module2ApplicationAnalysisSchema.parse(module2ApplicationAnalysis),
    ).toEqual(applicationAnalysis);
  });
});
