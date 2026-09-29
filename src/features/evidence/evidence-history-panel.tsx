"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EvidenceApiError } from "@/features/evidence/browser-api";
import {
  useEvidenceDocuments,
  useEvidenceReviews,
  useStartEvidenceIntake,
} from "@/features/evidence/use-evidence";

export function EvidenceHistoryPanel({
  onReviewSelected,
}: {
  onReviewSelected: (reviewRunId: string) => void;
}) {
  const documents = useEvidenceDocuments();
  const reviews = useEvidenceReviews();
  const startReview = useStartEvidenceIntake();

  async function handleStartReview(documentId: string) {
    try {
      const review = await startReview.mutateAsync({
        kind: "existing",
        documentId,
      });
      onReviewSelected(review.reviewRunId);
    } catch {
      // The mutation error is displayed below.
    }
  }

  const isLoading = documents.isPending || reviews.isPending;
  const isError = documents.isError || reviews.isError;
  const error = documents.error ?? reviews.error;

  return (
    <section className="bg-card overflow-hidden rounded-3xl border shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Recovery
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Recent evidence
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Refresh evidence history"
          disabled={documents.isFetching || reviews.isFetching}
          onClick={() => {
            void documents.refetch();
            void reviews.refetch();
          }}
        >
          <RefreshCw
            aria-hidden="true"
            className={
              documents.isFetching || reviews.isFetching ? "animate-spin" : ""
            }
          />
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div
            role="status"
            className="text-muted-foreground flex items-center gap-3 py-8 text-sm"
          >
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Loading durable history…
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-xl border p-4 text-sm">
            <p className="font-medium">Evidence history is unavailable</p>
            <p className="text-muted-foreground mt-1 leading-6">
              {error instanceof EvidenceApiError
                ? error.message
                : "Check the CareerOps gateway and try again."}
            </p>
          </div>
        ) : documents.data.count === 0 ? (
          <div className="rounded-2xl border border-dashed px-5 py-8 text-center">
            <FileText
              aria-hidden="true"
              className="text-muted-foreground mx-auto size-5"
            />
            <p className="mt-3 text-sm font-medium">No evidence sources yet</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Add a trusted document or paste factual experience to begin.
            </p>
          </div>
        ) : (
          <ul aria-label="Recent evidence sources" className="space-y-3">
            {documents.data.items.slice(0, 6).map((document) => {
              const review = reviews.data.items.find(
                (item) => item.documentId === document.documentId,
              );

              return (
                <li
                  key={document.documentId}
                  className="rounded-2xl border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
                      <FileText
                        aria-hidden="true"
                        className="text-muted-foreground size-4"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {document.originalFilename}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatBytes(document.sizeBytes)} ·{" "}
                        {document.documentFormat.toUpperCase()}
                      </p>
                    </div>
                    {review?.status === "completed" ? (
                      <CheckCircle2
                        aria-label="Review completed"
                        className="size-4 shrink-0 text-emerald-600"
                      />
                    ) : (
                      <Clock3
                        aria-label="Review pending"
                        className="text-primary size-4 shrink-0"
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={startReview.isPending}
                    className="mt-3 w-full"
                    onClick={() => {
                      if (review === undefined) {
                        void handleStartReview(document.documentId);
                      } else {
                        onReviewSelected(review.reviewRunId);
                      }
                    }}
                  >
                    {review === undefined
                      ? "Start review"
                      : review.status === "completed"
                        ? "View result"
                        : "Continue review"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {startReview.isError && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {startReview.error instanceof EvidenceApiError
              ? startReview.error.message
              : "The evidence review could not be started."}
          </p>
        )}
      </div>
    </section>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(size < 1024 * 10 ? 1 : 0)} KiB`;
}
