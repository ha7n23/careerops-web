import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { createQueryClient, Providers } from "@/app/providers";

function QueryClientProbe() {
  const queryClient = useQueryClient();
  const staleTime = queryClient.getDefaultOptions().queries?.staleTime;

  return (
    <p>
      {staleTime === 60_000
        ? "Query client ready"
        : "Query client misconfigured"}
    </p>
  );
}

describe("Providers", () => {
  it("provides the configured query client to child components", () => {
    const queryClient = createQueryClient();

    render(
      <Providers queryClient={queryClient}>
        <QueryClientProbe />
      </Providers>,
    );

    expect(screen.getByText("Query client ready")).toBeInTheDocument();
  });
});
