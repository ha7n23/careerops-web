import { describe, expect, it } from "vitest";

import {
  applicationListSchema,
  applicationSummarySchema,
} from "@/features/applications/contracts";

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
    expect(applicationSummarySchema.parse(applicationResponse)).toEqual({
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
      applicationSummarySchema.parse({
        ...applicationResponse,
        status: "draft",
      }),
    ).toThrow();
  });

  it("rejects an inconsistent application count", () => {
    expect(() =>
      applicationListSchema.parse({
        applications: [applicationResponse],
        count: 2,
      }),
    ).toThrow("Application count does not match");
  });
});
