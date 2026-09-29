import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registryEvidence } from "@/test/evidence-fixtures";

const {
  useChangeRegistryEvidenceLifecycleMock,
  useRegistryEvidenceMock,
  useUpdateRegistryEvidenceMock,
} = vi.hoisted(() => ({
  useChangeRegistryEvidenceLifecycleMock: vi.fn(),
  useRegistryEvidenceMock: vi.fn(),
  useUpdateRegistryEvidenceMock: vi.fn(),
}));

vi.mock("@/features/evidence/use-evidence", () => ({
  useChangeRegistryEvidenceLifecycle: useChangeRegistryEvidenceLifecycleMock,
  useRegistryEvidence: useRegistryEvidenceMock,
  useUpdateRegistryEvidence: useUpdateRegistryEvidenceMock,
}));

import { EvidenceRegistryDetail } from "@/features/evidence/evidence-registry-detail";

describe("EvidenceRegistryDetail", () => {
  const lifecycleMutation = vi.fn();
  const updateMutation = vi.fn();

  beforeEach(() => {
    lifecycleMutation.mockReset();
    updateMutation.mockReset();
    useRegistryEvidenceMock.mockReturnValue({
      data: registryEvidence,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    useChangeRegistryEvidenceLifecycleMock.mockReturnValue({
      mutateAsync: lifecycleMutation,
      isPending: false,
      isError: false,
      error: null,
    });
    useUpdateRegistryEvidenceMock.mockReturnValue({
      mutateAsync: updateMutation,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("requires confirmation before archiving active evidence", async () => {
    const user = userEvent.setup();
    lifecycleMutation.mockResolvedValue({
      ...registryEvidence,
      lifecycleStatus: "archived",
    });
    render(<EvidenceRegistryDetail evidenceId="EVD-001" />);

    await user.click(screen.getByRole("button", { name: "Archive evidence" }));
    expect(lifecycleMutation).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm archive" }));

    await waitFor(() => expect(lifecycleMutation).toHaveBeenCalledOnce());
    expect(lifecycleMutation).toHaveBeenCalledWith({
      evidenceId: "EVD-001",
      action: "archive",
    });
  });

  it("saves edited grounded fields", async () => {
    const user = userEvent.setup();
    updateMutation.mockResolvedValue(registryEvidence);
    render(<EvidenceRegistryDetail evidenceId="EVD-001" />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const title = screen.getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "CareerOps evidence platform");
    await user.click(screen.getByRole("button", { name: "Save evidence" }));

    await waitFor(() => expect(updateMutation).toHaveBeenCalledOnce());
    expect(updateMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceId: "EVD-001",
        edit: expect.objectContaining({
          title: "CareerOps evidence platform",
          approvedClaims: ["Built a FastAPI service."],
        }),
      }),
    );
  });
});
