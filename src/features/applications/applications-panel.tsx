"use client";

import { BriefcaseBusiness, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/features/applications/contracts";
import { useApplications } from "@/features/applications/use-applications";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  preparing: "Preparing",
  ready_to_apply: "Ready to apply",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed: "Closed",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function ApplicationsPanel() {
  const { data, isPending, isError, isFetching, refetch } = useApplications();

  return (
    <section
      aria-labelledby="applications-heading"
      className="bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Your pipeline</p>
          <div className="mt-1 flex items-baseline gap-3">
            <h2
              id="applications-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Applications
            </h2>
            {data !== undefined && (
              <span className="text-muted-foreground text-sm">
                {data.count} {data.count === 1 ? "role" : "roles"}
              </span>
            )}
          </div>
        </div>

        {data !== undefined && data.count > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw
              aria-hidden="true"
              className={isFetching ? "animate-spin" : undefined}
            />
            {isFetching ? "Refreshing" : "Refresh"}
          </Button>
        )}
      </div>

      <div className="p-6">
        {isPending ? (
          <ApplicationsLoading />
        ) : isError ? (
          <ApplicationsError
            isRetrying={isFetching}
            onRetry={() => void refetch()}
          />
        ) : data.count === 0 ? (
          <ApplicationsEmpty />
        ) : (
          <ul aria-label="Applications" className="space-y-3">
            {data.applications.map((application) => (
              <li key={application.id}>
                <article className="bg-background flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium">{application.roleTitle}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {application.companyName}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <time
                      dateTime={application.updatedAt}
                      className="text-muted-foreground text-xs"
                    >
                      Updated{" "}
                      {dateFormatter.format(new Date(application.updatedAt))}
                    </time>
                    <span
                      aria-label={`Status: ${STATUS_LABELS[application.status]}`}
                      className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {STATUS_LABELS[application.status]}
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ApplicationsLoading() {
  return (
    <div role="status" aria-label="Loading applications" className="space-y-3">
      <span className="sr-only">Loading applications…</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="bg-muted h-20 animate-pulse rounded-xl"
        />
      ))}
    </div>
  );
}

function ApplicationsError({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/5 flex flex-col items-start gap-4 rounded-xl border p-5"
    >
      <div>
        <h3 className="font-medium">Applications could not be loaded</h3>
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

function ApplicationsEmpty() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="bg-muted rounded-full p-3">
        <BriefcaseBusiness
          aria-hidden="true"
          className="text-muted-foreground size-5"
        />
      </div>
      <h3 className="mt-4 font-medium">No applications yet</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-6">
        Applications created through CareerOps will appear here.
      </p>
    </div>
  );
}
