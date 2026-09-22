export const module2PendingActions = {
  actions: [
    {
      action_id: "6d62eb20-dfc5-469b-b0ca-e75899f5908b",
      application_id: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      action_type: "review_cv",
      description: "Review the generated CV proposals.",
      status: "pending",
      due_at: "2026-09-22T12:00:00Z",
    },
  ],
  count: 1,
} as const;

export const pendingActions = {
  actions: [
    {
      id: "6d62eb20-dfc5-469b-b0ca-e75899f5908b",
      applicationId: "9b52d879-79b6-4af4-a369-886b77f4bb6e",
      actionType: "review_cv",
      description: "Review the generated CV proposals.",
      status: "pending",
      dueAt: "2026-09-22T12:00:00Z",
    },
  ],
  count: 1,
} as const;
