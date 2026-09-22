import { z } from "zod";

import { applicationIdSchema } from "@/features/applications/contracts";

export const ACTION_ITEM_TYPES = [
  "review_cv",
  "submit_application",
  "follow_up",
  "check_status",
  "prepare_interview",
  "record_outcome",
] as const;

const actionItemTypeSchema = z.enum(ACTION_ITEM_TYPES);
const actionItemStatusSchema = z.enum(["pending", "completed", "cancelled"]);

const actionItemSchema = z.object({
  id: z.string().uuid(),
  applicationId: applicationIdSchema,
  actionType: actionItemTypeSchema,
  description: z.string().trim().min(1),
  status: actionItemStatusSchema,
  dueAt: z.string().datetime({ offset: true }).nullable(),
});

export const pendingActionsSchema = z
  .object({
    actions: z.array(actionItemSchema),
    count: z.number().int().nonnegative(),
  })
  .refine((result) => result.count === result.actions.length, {
    message: "Pending action count does not match the returned actions.",
    path: ["count"],
  });

const module2ActionItemSchema = z
  .object({
    action_id: z.string().uuid(),
    application_id: applicationIdSchema,
    action_type: actionItemTypeSchema,
    description: z.string().trim().min(1),
    status: actionItemStatusSchema,
    due_at: z.string().datetime({ offset: true }).nullable(),
  })
  .transform((action) =>
    actionItemSchema.parse({
      id: action.action_id,
      applicationId: action.application_id,
      actionType: action.action_type,
      description: action.description,
      status: action.status,
      dueAt: action.due_at,
    }),
  );

export const module2PendingActionsSchema = z
  .object({
    actions: z.array(module2ActionItemSchema),
    count: z.number().int().nonnegative(),
  })
  .pipe(pendingActionsSchema);

export type ActionItemType = z.infer<typeof actionItemTypeSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type PendingActions = z.infer<typeof pendingActionsSchema>;
