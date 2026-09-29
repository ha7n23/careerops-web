import { beforeEach, describe, expect, it, vi } from "vitest";

import { registryEvidence } from "@/test/evidence-fixtures";

const { editRegistryEvidenceMock, getRegistryEvidenceMock } = vi.hoisted(
  () => ({
    editRegistryEvidenceMock: vi.fn(),
    getRegistryEvidenceMock: vi.fn(),
  }),
);

vi.mock("@/features/evidence/server", () => ({
  editRegistryEvidence: editRegistryEvidenceMock,
  getRegistryEvidence: getRegistryEvidenceMock,
}));

import { GET, PATCH } from "@/app/api/evidence/registry/[evidenceId]/route";

function createContext(evidenceId: string) {
  return { params: Promise.resolve({ evidenceId }) };
}

describe("/api/evidence/registry/[evidenceId]", () => {
  beforeEach(() => {
    editRegistryEvidenceMock.mockReset();
    getRegistryEvidenceMock.mockReset();
  });

  it("retrieves one evidence record", async () => {
    getRegistryEvidenceMock.mockResolvedValue(registryEvidence);

    const response = await GET(
      new Request("http://localhost/api/evidence/registry/EVD-001"),
      createContext("EVD-001"),
    );

    expect(response.status).toBe(200);
    expect(getRegistryEvidenceMock).toHaveBeenCalledWith("EVD-001");
  });

  it("saves a grounded evidence edit", async () => {
    editRegistryEvidenceMock.mockResolvedValue({
      ...registryEvidence,
      title: "CareerOps platform API",
    });
    const edit = {
      title: "CareerOps platform API",
      approvedClaims: ["Built a FastAPI service."],
    };

    const response = await PATCH(
      new Request("http://localhost/api/evidence/registry/EVD-001", {
        method: "PATCH",
        body: JSON.stringify(edit),
      }),
      createContext("EVD-001"),
    );

    expect(response.status).toBe(200);
    expect(editRegistryEvidenceMock).toHaveBeenCalledWith("EVD-001", edit);
  });

  it("rejects an empty edit", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/evidence/registry/EVD-001", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
      createContext("EVD-001"),
    );

    expect(response.status).toBe(400);
    expect(editRegistryEvidenceMock).not.toHaveBeenCalled();
  });
});
