import { z } from "zod";

export const APPLICATION_STATUSES = [
  "saved",
  "preparing",
  "ready_to_apply",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const applicationIdSchema = z.string().uuid();

export const applicationSummarySchema = z.object({
  id: applicationIdSchema,
  companyName: z.string().trim().min(1),
  roleTitle: z.string().trim().min(1),
  status: applicationStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const applicationListSchema = z
  .object({
    applications: z.array(applicationSummarySchema),
    count: z.number().int().nonnegative(),
  })
  .refine((result) => result.count === result.applications.length, {
    message: "Application count does not match the returned applications.",
    path: ["count"],
  });

export const createApplicationFieldsSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Enter the company name.")
    .max(255, "Company name must be 255 characters or fewer."),
  roleTitle: z
    .string()
    .trim()
    .min(1, "Enter the role title.")
    .max(255, "Role title must be 255 characters or fewer."),
});

export const createApplicationRequestSchema =
  createApplicationFieldsSchema.extend({
    idempotencyKey: z.string().trim().min(1).max(128),
  });

export const module2ApplicationSummarySchema = z
  .object({
    application_id: applicationIdSchema,
    company_name: z.string().trim().min(1),
    role_title: z.string().trim().min(1),
    status: applicationStatusSchema,
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .transform((application) =>
    applicationSummarySchema.parse({
      id: application.application_id,
      companyName: application.company_name,
      roleTitle: application.role_title,
      status: application.status,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
    }),
  );

export const module2ApplicationListSchema = z
  .object({
    applications: z.array(module2ApplicationSummarySchema),
    count: z.number().int().nonnegative(),
  })
  .refine((result) => result.count === result.applications.length, {
    message: "Application count does not match the returned applications.",
    path: ["count"],
  });

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export type ApplicationList = z.infer<typeof applicationListSchema>;

export type CreateApplicationFields = z.infer<
  typeof createApplicationFieldsSchema
>;
export type CreateApplicationRequest = z.infer<
  typeof createApplicationRequestSchema
>;
