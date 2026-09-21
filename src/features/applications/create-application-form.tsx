"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  createApplicationFieldsSchema,
  type ApplicationSummary,
  type CreateApplicationFields,
} from "@/features/applications/contracts";
import { useCreateApplication } from "@/features/applications/use-applications";

type CreateApplicationFormProps = {
  onCancel: () => void;
  onCreated: (application: ApplicationSummary) => void;
};

type SubmissionAttempt = {
  fingerprint: string;
  idempotencyKey: string;
};

export function CreateApplicationForm({
  onCancel,
  onCreated,
}: CreateApplicationFormProps) {
  const [submissionAttempt, setSubmissionAttempt] =
    useState<SubmissionAttempt | null>(null);
  const { mutateAsync, isPending, error } = useCreateApplication();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApplicationFields>({
    resolver: zodResolver(createApplicationFieldsSchema),
    defaultValues: {
      companyName: "",
      roleTitle: "",
    },
  });

  const submitForm = handleSubmit(async (fields) => {
    const fingerprint = JSON.stringify(fields);
    const idempotencyKey =
      submissionAttempt?.fingerprint === fingerprint
        ? submissionAttempt.idempotencyKey
        : crypto.randomUUID();

    setSubmissionAttempt({
      fingerprint,
      idempotencyKey,
    });

    try {
      const application = await mutateAsync({
        ...fields,
        idempotencyKey,
      });

      setSubmissionAttempt(null);
      reset();
      onCreated(application);
    } catch {
      // React Query exposes the safe request error through `error` below.
    }
  });

  return (
    <form
      aria-label="Add application"
      noValidate
      onSubmit={(event) => void submitForm(event)}
      className="bg-muted/30 border-b px-6 py-5"
    >
      <div>
        <h3 className="font-semibold">Add an application</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Save a role to your pipeline. This does not start AI preparation or
          submit anything to an employer.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company-name" className="text-sm font-medium">
            Company name
          </label>
          <input
            id="company-name"
            type="text"
            autoComplete="organization"
            aria-invalid={errors.companyName !== undefined}
            aria-describedby={
              errors.companyName === undefined
                ? undefined
                : "company-name-error"
            }
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
            {...register("companyName")}
          />
          {errors.companyName !== undefined && (
            <p
              id="company-name-error"
              className="text-destructive mt-1.5 text-sm"
            >
              {errors.companyName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="role-title" className="text-sm font-medium">
            Role title
          </label>
          <input
            id="role-title"
            type="text"
            autoComplete="organization-title"
            aria-invalid={errors.roleTitle !== undefined}
            aria-describedby={
              errors.roleTitle === undefined ? undefined : "role-title-error"
            }
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
            {...register("roleTitle")}
          />
          {errors.roleTitle !== undefined && (
            <p
              id="role-title-error"
              className="text-destructive mt-1.5 text-sm"
            >
              {errors.roleTitle.message}
            </p>
          )}
        </div>
      </div>

      {error !== null && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          The application could not be saved. Check that CareerOps services are
          running, then try again.
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isPending}>
          {isPending && (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          )}
          {isPending ? "Saving" : "Save application"}
        </Button>
      </div>
    </form>
  );
}
