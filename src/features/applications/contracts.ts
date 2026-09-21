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

export const applicationSummarySchema = z.object({
  id: z.string().uuid(),
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

export const module2ApplicationSummarySchema = z
  .object({
    application_id: z.string().uuid(),
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
