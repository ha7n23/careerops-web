import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { evidenceRegistryPage } from "@/test/evidence-fixtures";

const { useEvidenceRegistryMock } = vi.hoisted(() => ({
  useEvidenceRegistryMock: vi.fn(),
}));

vi.mock("@/features/evidence/use-evidence", () => ({
  useEvidenceRegistry: useEvidenceRegistryMock,
}));

vi.mock("@/features/evidence/evidence-registry-detail", () => ({
  EvidenceRegistryDetail: ({ evidenceId }: { evidenceId: string | null }) => (
    <div data-testid="registry-detail">{evidenceId ?? "none"}</div>
  ),
}));

import { EvidenceRegistryWorkspace } from "@/features/evidence/evidence-registry-workspace";

describe("EvidenceRegistryWorkspace", () => {
  beforeEach(() => {
    useEvidenceRegistryMock.mockReset();
    useEvidenceRegistryMock.mockReturnValue({
      data: evidenceRegistryPage,
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("applies search and category filters and selects a record", async () => {
    const user = userEvent.setup();
    render(<EvidenceRegistryWorkspace />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search approved evidence" }),
      "FastAPI",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by category" }),
      "project",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(
      screen.getByRole("button", { name: /CareerOps platform/ }),
    );

    expect(useEvidenceRegistryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "FastAPI",
        category: "project",
        offset: 0,
      }),
    );
    expect(screen.getByTestId("registry-detail")).toHaveTextContent("EVD-001");
  });

  it("requests the next bounded page", async () => {
    const user = userEvent.setup();
    useEvidenceRegistryMock.mockReturnValue({
      data: { ...evidenceRegistryPage, total: 7, hasMore: true },
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<EvidenceRegistryWorkspace />);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(useEvidenceRegistryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 6, limit: 6 }),
    );
  });
});
