"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  prepareApplicationRequestSchema,
  type PrepareApplicationRequest,
} from "@/features/applications/analysis-contracts";
import { usePrepareApplication } from "@/features/applications/use-applications";

type PrepareApplicationFormProps = {
  applicationId: string;
};

export function PrepareApplicationForm({
  applicationId,
}: PrepareApplicationFormProps) {
  const { mutateAsync, isPending, error } = usePrepareApplication();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrepareApplicationRequest>({
    resolver: zodResolver(prepareApplicationRequestSchema),
    defaultValues: {
      jobDescription: "",
    },
  });

  const submitForm = handleSubmit(async (input) => {
    try {
      await mutateAsync({ applicationId, input });
    } catch {
      // React Query exposes the safe request error through `error` below.
    }
  });

  return (
    <form
      aria-label="Prepare application"
      noValidate
      onSubmit={(event) => void submitForm(event)}
      className="border-t px-6 py-6"
    >
      <div className="flex gap-3">
        <div className="bg-muted h-fit rounded-lg p-2.5">
          <Sparkles
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </div>

        <div>
          <h2 className="font-semibold">Prepare this application</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Paste the complete job description. CareerOps will run AI analysis
            and generate evidence-grounded CV proposals. It will not submit an
            application to the employer.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="job-description" className="text-sm font-medium">
          Job description
        </label>
        <textarea
          id="job-description"
          rows={10}
          aria-invalid={errors.jobDescription !== undefined}
          aria-describedby={
            errors.jobDescription === undefined
              ? "job-description-help"
              : "job-description-help job-description-error"
          }
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-3"
          {...register("jobDescription")}
        />

        <p
          id="job-description-help"
          className="text-muted-foreground mt-1.5 text-xs"
        >
          Maximum 50,000 characters.
        </p>

        {errors.jobDescription !== undefined && (
          <p
            id="job-description-error"
            className="text-destructive mt-1.5 text-sm"
          >
            {errors.jobDescription.message}
          </p>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          Preparation could not be confirmed. Check the application status and
          that CareerOps services are running before trying again.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          )}
          {isPending ? "Preparing" : "Prepare application"}
        </Button>
      </div>
    </form>
  );
}
