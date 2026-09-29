import { beforeEach, describe, expect, it, vi } from "vitest";

import { registryEvidence } from "@/test/evidence-fixtures";

const { setRegistryEvidenceLifecycleMock } = vi.hoisted(() => ({
  setRegistryEvidenceLifecycleMock: vi.fn(),
}));

vi.mock("@/features/evidence/server", () => ({
  setRegistryEvidenceLifecycle: setRegistryEvidenceLifecycleMock,
}));

import { POST } from "@/app/api/evidence/registry/[evidenceId]/lifecycle/route";

function createContext(evidenceId: string) {
  return { params: Promise.resolve({ evidenceId }) };
}

describe("POST /api/evidence/registry/[evidenceId]/lifecycle", () => {
  beforeEach(() => {
    setRegistryEvidenceLifecycleMock.mockReset();
  });

  it("archives evidence through the authenticated gateway", async () => {
    setRegistryEvidenceLifecycleMock.mockResolvedValue({
      ...registryEvidence,
      lifecycleStatus: "archived",
    });

    const response = await POST(
      new Request("http://localhost/api/evidence/registry/EVD-001/lifecycle", {
        method: "POST",
        body: JSON.stringify({ action: "archive" }),
      }),
      createContext("EVD-001"),
    );

    expect(response.status).toBe(200);
    expect(setRegistryEvidenceLifecycleMock).toHaveBeenCalledWith(
      "EVD-001",
      "archive",
    );
  });

  it("rejects unsupported lifecycle actions", async () => {
    const response = await POST(
      new Request("http://localhost/api/evidence/registry/EVD-001/lifecycle", {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
      }),
      createContext("EVD-001"),
    );

    expect(response.status).toBe(400);
    expect(setRegistryEvidenceLifecycleMock).not.toHaveBeenCalled();
  });
});
