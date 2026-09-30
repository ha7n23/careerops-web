import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";

describe("ErrorPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers safe recovery without exposing the error message", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorPage
        error={Object.assign(new Error("private upstream detail"), {
          digest: "ERR-123",
        })}
        retry={retry}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "CareerOps could not display this page",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("private upstream detail"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Reference: ERR-123")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
