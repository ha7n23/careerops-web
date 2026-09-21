"use client";

import { ArrowRight, BriefcaseBusiness, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreateApplicationForm } from "@/features/applications/create-application-form";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/features/applications/contracts";
import {
  APPLICATION_STATUS_LABELS,
  formatApplicationDate,
} from "@/features/applications/presentation";
import { useApplications } from "@/features/applications/use-applications";

type ApplicationStatusFilter = ApplicationStatus | "all";

export function ApplicationsPanel() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [creationAnnouncement, setCreationAnnouncement] = useState<
    string | null
  >(null);
  const [statusFilter, setStatusFilter] =
    useState<ApplicationStatusFilter>("all");

  const selectedStatus = statusFilter === "all" ? undefined : statusFilter;

  const { data, isPending, isError, isFetching, refetch } =
    useApplications(selectedStatus);

  return (
    <section
      aria-labelledby="applications-heading"
      aria-busy={isFetching}
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreationAnnouncement(null);
              setIsCreateFormOpen((isOpen) => !isOpen);
            }}
          >
            <Plus aria-hidden="true" />
            {isCreateFormOpen ? "Close form" : "Add application"}
          </Button>

          <label
            htmlFor="application-status-filter"
            className="text-muted-foreground text-sm"
          >
            Status
          </label>

          <select
            id="application-status-filter"
            aria-label="Filter applications by status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ApplicationStatusFilter)
            }
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
          >
            <option value="all">All statuses</option>

            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

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
      </div>

      {isCreateFormOpen && (
        <CreateApplicationForm
          onCancel={() => setIsCreateFormOpen(false)}
          onCreated={(application) => {
            setStatusFilter("all");
            setIsCreateFormOpen(false);
            setCreationAnnouncement(
              `${application.roleTitle} at ${application.companyName} was added.`,
            );
          }}
        />
      )}

      <div className="p-6">
        {creationAnnouncement !== null && (
          <p
            role="status"
            className="border-border bg-muted/40 mb-5 rounded-lg border px-4 py-3 text-sm"
          >
            {creationAnnouncement}
          </p>
        )}

        {isPending ? (
          <ApplicationsLoading />
        ) : isError ? (
          <ApplicationsError
            isRetrying={isFetching}
            onRetry={() => void refetch()}
          />
        ) : data.count === 0 ? (
          <ApplicationsEmpty isFiltered={selectedStatus !== undefined} />
        ) : (
          <ul aria-label="Applications" className="space-y-3">
            {data.applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/applications/${application.id}`}
                  className="group focus-visible:border-ring focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
                >
                  <article className="bg-background group-hover:bg-muted/40 flex flex-col gap-4 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between">
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
                        Updated {formatApplicationDate(application.updatedAt)}
                      </time>

                      <span
                        aria-label={`Status: ${APPLICATION_STATUS_LABELS[application.status]}`}
                        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>

                      <ArrowRight
                        aria-hidden="true"
                        className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </article>
                </Link>
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

function ApplicationsEmpty({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="bg-muted rounded-full p-3">
        <BriefcaseBusiness
          aria-hidden="true"
          className="text-muted-foreground size-5"
        />
      </div>

      <h3 className="mt-4 font-medium">
        {isFiltered
          ? "No applications match this status"
          : "No applications yet"}
      </h3>

      <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-6">
        {isFiltered
          ? "Choose another status to see the rest of your pipeline."
          : "Applications created through CareerOps will appear here."}
      </p>
    </div>
  );
}
