import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import NotFound from "@/app/not-found";

it("returns users safely to the workspace", () => {
  render(<NotFound />);

  expect(
    screen.getByRole("heading", {
      name: "This CareerOps page does not exist",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Return to overview/i }),
  ).toHaveAttribute("href", "/");
});
