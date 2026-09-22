"use client";

import { Building2, CalendarDays, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  APPLICATION_STATUS_LABELS,
  formatApplicationDate,
} from "@/features/applications/presentation";
import { useApplication } from "@/features/applications/use-applications";
import { PrepareApplicationForm } from "@/features/applications/prepare-application-form";

type ApplicationDetailPanelProps = {
  applicationId: string;
};

export function ApplicationDetailPanel({
  applicationId,
}: ApplicationDetailPanelProps) {
  const { data, isPending, isError, isFetching, refetch } =
    useApplication(applicationId);

  if (isPending) {
    return <ApplicationDetailLoading />;
  }

  if (isError) {
    return (
      <ApplicationDetailError
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <section
      aria-labelledby="application-title"
      aria-busy={isFetching}
      className="bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-sm"
    >
      <div className="flex flex-col gap-5 border-b px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="bg-muted mt-1 rounded-xl p-3">
            <Building2
              aria-hidden="true"
              className="text-muted-foreground size-5"
            />
          </div>

          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">{data.companyName}</p>
            <h1
              id="application-title"
              className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {data.roleTitle}
            </h1>
          </div>
        </div>

        <span
          aria-label={`Status: ${APPLICATION_STATUS_LABELS[data.status]}`}
          className="bg-muted text-muted-foreground w-fit rounded-full px-3 py-1 text-sm font-medium"
        >
          {APPLICATION_STATUS_LABELS[data.status]}
        </span>
      </div>

      <dl className="bg-border grid gap-px sm:grid-cols-2">
        <DetailItem label="Created">
          <CalendarDays aria-hidden="true" className="size-4" />
          <time dateTime={data.createdAt}>
            {formatApplicationDate(data.createdAt)}
          </time>
        </DetailItem>

        <DetailItem label="Last updated">
          <CalendarDays aria-hidden="true" className="size-4" />
          <time dateTime={data.updatedAt}>
            {formatApplicationDate(data.updatedAt)}
          </time>
        </DetailItem>

        <div className="bg-card px-6 py-5 sm:col-span-2">
          <dt className="text-muted-foreground text-sm">Application ID</dt>
          <dd className="mt-2 font-mono text-sm break-all">{data.id}</dd>
        </div>
      </dl>

      {data.status === "saved" && (
        <PrepareApplicationForm applicationId={data.id} />
      )}
    </section>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card px-6 py-5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-2 flex items-center gap-2 text-sm">{children}</dd>
    </div>
  );
}

function ApplicationDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading application"
      className="bg-card space-y-5 rounded-2xl border p-6 shadow-sm"
    >
      <span className="sr-only">Loading application…</span>

      <div
        aria-hidden="true"
        className="bg-muted h-8 w-2/3 animate-pulse rounded"
      />

      <div
        aria-hidden="true"
        className="bg-muted h-32 animate-pulse rounded-xl"
      />
    </div>
  );
}

function ApplicationDetailError({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/5 flex flex-col items-start gap-4 rounded-2xl border p-6"
    >
      <div>
        <h1 className="text-lg font-semibold">
          Application could not be loaded
        </h1>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Check that the CareerOps services are running, then try again.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isRetrying}
        onClick={onRetry}
      >
        <RefreshCw
          aria-hidden="true"
          className={isRetrying ? "animate-spin" : undefined}
        />
        {isRetrying ? "Trying again" : "Try again"}
      </Button>
    </div>
  );
}
