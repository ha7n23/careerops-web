"use client";

import { useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Database,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EvidenceApiError } from "@/features/evidence/browser-api";
import {
  EVIDENCE_CATEGORIES,
  type EvidenceRegistryQuery,
} from "@/features/evidence/contracts";
import { EvidenceRegistryDetail } from "@/features/evidence/evidence-registry-detail";
import { useEvidenceRegistry } from "@/features/evidence/use-evidence";

const PAGE_SIZE = 6;

const INITIAL_QUERY: EvidenceRegistryQuery = {
  query: "",
  category: null,
  lifecycleStatus: "active",
  offset: 0,
  limit: PAGE_SIZE,
};

export function EvidenceRegistryWorkspace() {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState<EvidenceRegistryQuery>(INITIAL_QUERY);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );
  const registry = useEvidenceRegistry(query);

  function updateQuery(changes: Partial<EvidenceRegistryQuery>) {
    setQuery((current) => ({ ...current, ...changes, offset: 0 }));
    setSelectedEvidenceId(null);
  }

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-3xl border p-5 shadow-sm sm:p-6">
        <form
          className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_13rem_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            updateQuery({ query: draftQuery.trim() });
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search approved evidence</span>
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            />
            <input
              type="search"
              value={draftQuery}
              placeholder="Search titles, claims, or technologies"
              className="border-input bg-background h-11 w-full rounded-xl border pr-4 pl-10 text-sm"
              onChange={(event) => setDraftQuery(event.target.value)}
            />
          </label>

          <label>
            <span className="sr-only">Evidence category</span>
            <select
              aria-label="Filter by category"
              className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
              value={query.category ?? "all"}
              onChange={(event) =>
                updateQuery({
                  category:
                    event.target.value === "all"
                      ? null
                      : (event.target
                          .value as EvidenceRegistryQuery["category"]),
                })
              }
            >
              <option value="all">All categories</option>
              {EVIDENCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Evidence lifecycle</span>
            <select
              aria-label="Filter by lifecycle"
              className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
              value={query.lifecycleStatus}
              onChange={(event) =>
                updateQuery({
                  lifecycleStatus: event.target.value as "active" | "archived",
                })
              }
            >
              <option value="active">Active evidence</option>
              <option value="archived">Archived evidence</option>
            </select>
          </label>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 lg:flex-none">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Refresh Evidence Registry"
              disabled={registry.isFetching}
              onClick={() => void registry.refetch()}
            >
              <RefreshCw
                aria-hidden="true"
                className={registry.isFetching ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </form>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <section className="bg-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-5">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                Approved source of truth
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Evidence Registry
              </h2>
            </div>
            {registry.data !== undefined && (
              <p className="text-muted-foreground text-sm">
                {registry.data.total} record
                {registry.data.total === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="p-6">
            {registry.isPending ? (
              <div
                role="status"
                className="text-muted-foreground flex min-h-64 items-center justify-center gap-3 text-sm"
              >
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Loading approved evidence…
              </div>
            ) : registry.isError ? (
              <RegistryError
                error={registry.error}
                onRetry={() => void registry.refetch()}
              />
            ) : registry.data.count === 0 ? (
              <RegistryEmptyState lifecycleStatus={query.lifecycleStatus} />
            ) : (
              <>
                <ul
                  aria-label="Evidence Registry results"
                  className="space-y-3"
                >
                  {registry.data.items.map((evidence) => (
                    <li key={evidence.evidenceId}>
                      <button
                        type="button"
                        aria-pressed={
                          selectedEvidenceId === evidence.evidenceId
                        }
                        className="hover:border-primary/35 aria-pressed:border-primary aria-pressed:bg-primary/5 w-full rounded-2xl border p-4 text-left transition-colors"
                        onClick={() =>
                          setSelectedEvidenceId(evidence.evidenceId)
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-muted rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase">
                                {formatLabel(evidence.category)}
                              </span>
                              {evidence.lifecycleStatus === "active" ? (
                                <ShieldCheck
                                  aria-label="Active evidence"
                                  className="size-4 text-emerald-600"
                                />
                              ) : (
                                <Archive
                                  aria-label="Archived evidence"
                                  className="text-muted-foreground size-4"
                                />
                              )}
                            </div>
                            <h3 className="mt-3 truncate font-semibold">
                              {evidence.title}
                            </h3>
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-6">
                              {evidence.approvedClaims[0]}
                            </p>
                          </div>
                          <ChevronRight
                            aria-hidden="true"
                            className="text-muted-foreground mt-1 size-4 shrink-0"
                          />
                        </div>
                        {evidence.technologies.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {evidence.technologies
                              .slice(0, 4)
                              .map((technology) => (
                                <span
                                  key={technology}
                                  className="bg-primary/8 text-primary rounded-full px-2.5 py-1 text-xs"
                                >
                                  {technology}
                                </span>
                              ))}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                <RegistryPagination
                  query={query}
                  total={registry.data.total}
                  hasMore={registry.data.hasMore}
                  onOffsetChange={(offset) => {
                    setQuery((current) => ({ ...current, offset }));
                    setSelectedEvidenceId(null);
                  }}
                />
              </>
            )}
          </div>
        </section>

        <EvidenceRegistryDetail evidenceId={selectedEvidenceId} />
      </div>
    </div>
  );
}

function RegistryPagination({
  query,
  total,
  hasMore,
  onOffsetChange,
}: {
  query: EvidenceRegistryQuery;
  total: number;
  hasMore: boolean;
  onOffsetChange: (offset: number) => void;
}) {
  const start = total === 0 ? 0 : query.offset + 1;
  const end = Math.min(query.offset + query.limit, total);

  return (
    <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5">
      <p className="text-muted-foreground text-xs">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={query.offset === 0}
          onClick={() =>
            onOffsetChange(Math.max(0, query.offset - query.limit))
          }
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => onOffsetChange(query.offset + query.limit)}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function RegistryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-2xl border p-5 text-sm">
      <p className="font-medium">Evidence Registry is unavailable</p>
      <p className="text-muted-foreground mt-2 leading-6">
        {error instanceof EvidenceApiError
          ? error.message
          : "Check the CareerOps gateway and try again."}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

function RegistryEmptyState({
  lifecycleStatus,
}: {
  lifecycleStatus: "active" | "archived";
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed p-8 text-center">
      <div className="max-w-sm">
        <Database
          aria-hidden="true"
          className="text-muted-foreground mx-auto size-6"
        />
        <h3 className="mt-4 font-semibold">
          No {lifecycleStatus} evidence found
        </h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {lifecycleStatus === "active"
            ? "Approve evidence from the intake workspace or adjust your filters."
            : "Archived evidence remains recoverable and will appear here."}
        </p>
      </div>
    </div>
  );
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}
