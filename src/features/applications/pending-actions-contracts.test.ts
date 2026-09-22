import { describe, expect, it } from "vitest";

import { module2PendingActionsSchema } from "@/features/applications/pending-actions-contracts";
import {
  module2PendingActions,
  pendingActions,
} from "@/test/pending-actions-fixtures";

describe("module2PendingActionsSchema", () => {
  it("transforms Module 2 pending actions into the frontend shape", () => {
    expect(module2PendingActionsSchema.parse(module2PendingActions)).toEqual(
      pendingActions,
    );
  });

  it("rejects a count that does not match the returned actions", () => {
    expect(() =>
      module2PendingActionsSchema.parse({
        ...module2PendingActions,
        count: 2,
      }),
    ).toThrow("Pending action count does not match the returned actions.");
  });
});
