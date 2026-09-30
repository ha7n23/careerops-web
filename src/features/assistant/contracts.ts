import { z } from "zod";

export const assistantMessageRequestSchema = z.object({
  message: z.string().trim().min(1).max(4_000),
});

export const assistantMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const assistantMessageResponseSchema = z.object({
  message: assistantMessageSchema,
});

export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type AssistantMessageResponse = z.infer<
  typeof assistantMessageResponseSchema
>;
