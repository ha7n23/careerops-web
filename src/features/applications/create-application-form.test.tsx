import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useCreateApplicationMock } = vi.hoisted(() => ({
  useCreateApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/use-applications", () => ({
  useCreateApplication: useCreateApplicationMock,
}));

import { CreateApplicationForm } from "@/features/applications/create-application-form";

const createdApplication = {
  id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
  companyName: "Example Bank",
  roleTitle: "Graduate AI Engineer",
  status: "saved",
  createdAt: "2026-09-20T10:00:00Z",
  updatedAt: "2026-09-20T10:00:00Z",
};

describe("CreateApplicationForm", () => {
  beforeEach(() => {
    useCreateApplicationMock.mockReset();
  });

  it("shows field errors before sending invalid input", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();

    useCreateApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(<CreateApplicationForm onCancel={vi.fn()} onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save application" }));

    expect(screen.getByText("Enter the company name.")).toBeInTheDocument();
    expect(screen.getByText("Enter the role title.")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("reuses the idempotency key when unchanged input is retried", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network outcome unknown"))
      .mockResolvedValueOnce(createdApplication);

    useCreateApplicationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    render(<CreateApplicationForm onCancel={vi.fn()} onCreated={onCreated} />);

    await user.type(
      screen.getByRole("textbox", { name: "Company name" }),
      " Example Bank ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Role title" }),
      " Graduate AI Engineer ",
    );

    const submitButton = screen.getByRole("button", {
      name: "Save application",
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(2);
    });

    const firstInput = mutateAsync.mock.calls[0][0];
    const secondInput = mutateAsync.mock.calls[1][0];

    expect(firstInput).toMatchObject({
      companyName: "Example Bank",
      roleTitle: "Graduate AI Engineer",
    });
    expect(secondInput.idempotencyKey).toBe(firstInput.idempotencyKey);
    expect(onCreated).toHaveBeenCalledWith(createdApplication);
  });

  it("shows a safe request error", () => {
    useCreateApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: new Error("Sensitive upstream failure"),
    });

    render(<CreateApplicationForm onCancel={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The application could not be saved",
    );
    expect(
      screen.queryByText("Sensitive upstream failure"),
    ).not.toBeInTheDocument();
  });

  it("allows the user to cancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    useCreateApplicationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });

    render(<CreateApplicationForm onCancel={onCancel} onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
