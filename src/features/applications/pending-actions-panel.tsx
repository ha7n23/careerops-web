"use client";

import { ArrowRight, Bell, CircleCheck, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ActionItemType } from "@/features/applications/pending-actions-contracts";
import { formatApplicationDate } from "@/features/applications/presentation";
import { usePendingActions } from "@/features/applications/use-applications";

const ACTION_ITEM_LABELS: Record<ActionItemType, string> = {
  review_cv: "Review CV",
  submit_application: "Submit application",
  follow_up: "Follow up",
  check_status: "Check status",
  prepare_interview: "Prepare for interview",
  record_outcome: "Record outcome",
};

export function PendingActionsPanel() {
  const { data, isPending, isError, isFetching, refetch } = usePendingActions();

  return (
    <section
      aria-labelledby="pending-actions-heading"
      aria-busy={isFetching}
      className="bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b px-6 py-5">
        <div>
          <p className="text-muted-foreground text-sm">Your next steps</p>

          <div className="mt-1 flex items-baseline gap-3">
            <h2
              id="pending-actions-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Needs attention
            </h2>

            {data !== undefined && (
              <span className="text-muted-foreground text-sm">
                {data.count} {data.count === 1 ? "action" : "actions"}
              </span>
            )}
          </div>
        </div>

        {data !== undefined && (
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
          <PendingActionsLoading />
        ) : isError ? (
          <PendingActionsError
            isRetrying={isFetching}
            onRetry={() => void refetch()}
          />
        ) : data.count === 0 ? (
          <PendingActionsEmpty />
        ) : (
          <ul aria-label="Pending actions" className="space-y-3">
            {data.actions.map((action) => (
              <li key={action.id}>
                <Link
                  href={`/applications/${action.applicationId}`}
                  className="group focus-visible:border-ring focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
                >
                  <article className="bg-background group-hover:bg-muted/40 flex items-start gap-4 rounded-xl border p-5 transition-colors">
                    <div className="bg-muted shrink-0 rounded-lg p-2.5">
                      <Bell
                        aria-hidden="true"
                        className="text-muted-foreground size-4"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">
                        {ACTION_ITEM_LABELS[action.actionType]}
                      </h3>

                      <p className="text-muted-foreground mt-1 text-sm leading-6">
                        {action.description}
                      </p>

                      {action.dueAt !== null && (
                        <time
                          dateTime={action.dueAt}
                          className="text-muted-foreground mt-2 block text-xs"
                        >
                          Due {formatApplicationDate(action.dueAt)}
                        </time>
                      )}
                    </div>

                    <ArrowRight
                      aria-hidden="true"
                      className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    />
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

function PendingActionsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading pending actions"
      className="space-y-3"
    >
      <span className="sr-only">Loading pending actions…</span>

      {[0, 1].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="bg-muted h-24 animate-pulse rounded-xl"
        />
      ))}
    </div>
  );
}

function PendingActionsError({
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
        <h3 className="font-medium">Pending actions could not be loaded</h3>

        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Your applications are still available below. Check the CareerOps
          services, then try again.
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

function PendingActionsEmpty() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="bg-muted rounded-full p-3">
        <CircleCheck
          aria-hidden="true"
          className="text-muted-foreground size-5"
        />
      </div>

      <h3 className="mt-4 font-medium">You&apos;re all caught up</h3>

      <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-6">
        CareerOps has no pending actions for you right now.
      </p>
    </div>
  );
}
