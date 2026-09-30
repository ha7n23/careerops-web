import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

describe("AppShell", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders the product navigation and page content", () => {
    render(
      <AppShell>
        <p>Workspace content</p>
      </AppShell>,
    );

    expect(screen.getByText("Workspace content")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Overview" })[0],
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("link", { name: "Applications" })[0],
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByText(/never submits an application automatically/i),
    ).toBeInTheDocument();
  });

  it("marks nested application routes as active", () => {
    usePathname.mockReturnValue("/applications/APP-123");

    render(
      <AppShell>
        <p>Application detail</p>
      </AppShell>,
    );

    expect(
      screen.getAllByRole("link", { name: "Applications" })[0],
    ).toHaveAttribute("aria-current", "page");
  });
});
