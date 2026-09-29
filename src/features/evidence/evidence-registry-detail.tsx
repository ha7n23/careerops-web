"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EvidenceApiError } from "@/features/evidence/browser-api";
import {
  EVIDENCE_CATEGORIES,
  type EvidenceRegistryEdit,
  type RegistryEvidence,
} from "@/features/evidence/contracts";
import {
  useChangeRegistryEvidenceLifecycle,
  useRegistryEvidence,
  useUpdateRegistryEvidence,
} from "@/features/evidence/use-evidence";

export function EvidenceRegistryDetail({
  evidenceId,
}: {
  evidenceId: string | null;
}) {
  const evidence = useRegistryEvidence(evidenceId);

  if (evidenceId === null) {
    return (
      <aside className="bg-card flex min-h-[28rem] items-center justify-center rounded-3xl border border-dashed p-8 text-center">
        <div className="max-w-xs">
          <FileText
            aria-hidden="true"
            className="text-muted-foreground mx-auto size-6"
          />
          <h3 className="mt-4 font-semibold">Select an evidence record</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Review grounded claims, source provenance, and lifecycle controls.
          </p>
        </div>
      </aside>
    );
  }

  if (evidence.isPending) {
    return (
      <aside
        role="status"
        className="bg-card text-muted-foreground flex min-h-[28rem] items-center justify-center gap-3 rounded-3xl border p-8 text-sm"
      >
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading evidence record…
      </aside>
    );
  }

  if (evidence.isError) {
    return (
      <aside className="bg-card min-h-[28rem] rounded-3xl border p-7">
        <div role="alert" className="rounded-2xl border p-5 text-sm">
          <p className="font-medium">Evidence record is unavailable</p>
          <p className="text-muted-foreground mt-2 leading-6">
            {evidence.error instanceof EvidenceApiError
              ? evidence.error.message
              : "Check the CareerOps gateway and try again."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void evidence.refetch()}
          >
            Try again
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <EvidenceRecord key={evidence.data.evidenceId} evidence={evidence.data} />
  );
}

function EvidenceRecord({ evidence }: { evidence: RegistryEvidence }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const updateEvidence = useUpdateRegistryEvidence();
  const changeLifecycle = useChangeRegistryEvidenceLifecycle();

  async function handleLifecycle(action: "archive" | "restore") {
    try {
      await changeLifecycle.mutateAsync({
        evidenceId: evidence.evidenceId,
        action,
      });
      setConfirmArchive(false);
    } catch {
      // Mutation feedback is rendered below.
    }
  }

  return (
    <aside className="bg-card overflow-hidden rounded-3xl border shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase">
                {formatLabel(evidence.category)}
              </span>
              <span
                className={
                  evidence.lifecycleStatus === "active"
                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700 uppercase"
                    : "bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase"
                }
              >
                {evidence.lifecycleStatus}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              {evidence.title}
            </h2>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {evidence.evidenceId}
            </p>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6">
        {isEditing ? (
          <EvidenceEditForm
            evidence={evidence}
            isSaving={updateEvidence.isPending}
            onCancel={() => setIsEditing(false)}
            onSave={async (edit) => {
              try {
                await updateEvidence.mutateAsync({
                  evidenceId: evidence.evidenceId,
                  edit,
                });
                setIsEditing(false);
              } catch {
                // Mutation feedback is rendered below.
              }
            }}
          />
        ) : (
          <EvidenceReadView evidence={evidence} />
        )}

        {(updateEvidence.isError || changeLifecycle.isError) && (
          <p role="alert" className="text-destructive text-sm">
            {mutationMessage(updateEvidence.error ?? changeLifecycle.error)}
          </p>
        )}

        <div className="border-t pt-5">
          {evidence.lifecycleStatus === "archived" ? (
            <Button
              type="button"
              variant="outline"
              disabled={changeLifecycle.isPending}
              onClick={() => void handleLifecycle("restore")}
            >
              {changeLifecycle.isPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <RotateCcw aria-hidden="true" />
              )}
              Restore evidence
            </Button>
          ) : confirmArchive ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-sm font-medium text-amber-950">
                Archive this evidence?
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                It will be excluded from job analysis until restored.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={changeLifecycle.isPending}
                  onClick={() => void handleLifecycle("archive")}
                >
                  Confirm archive
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={changeLifecycle.isPending}
                  onClick={() => setConfirmArchive(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmArchive(true)}
            >
              <Archive aria-hidden="true" />
              Archive evidence
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

function EvidenceReadView({ evidence }: { evidence: RegistryEvidence }) {
  return (
    <>
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2
            aria-hidden="true"
            className="size-4 text-emerald-600"
          />
          Approved claims
        </div>
        <ul className="mt-3 space-y-2">
          {evidence.approvedClaims.map((claim) => (
            <li
              key={claim}
              className="bg-muted/55 rounded-xl px-4 py-3 text-sm leading-6"
            >
              {claim}
            </li>
          ))}
        </ul>
      </section>

      <TagSection title="Technologies" values={evidence.technologies} />
      <TagSection title="Capabilities" values={evidence.capabilities} />

      <section>
        <h3 className="text-sm font-semibold">Source provenance</h3>
        <div className="mt-3 space-y-3">
          {evidence.sourceReferences.map((source, index) => (
            <div
              key={`${source.sourceId}-${index}`}
              className="rounded-2xl border p-4"
            >
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {formatLabel(source.sourceType)} · {source.sourceId}
                {source.pageNumber === null
                  ? ""
                  : ` · Page ${source.pageNumber}`}
              </p>
              {source.sourceExcerpt !== null && (
                <blockquote className="mt-3 border-l-2 pl-3 text-sm leading-6">
                  {source.sourceExcerpt}
                </blockquote>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function EvidenceEditForm({
  evidence,
  isSaving,
  onCancel,
  onSave,
}: {
  evidence: RegistryEvidence;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (edit: EvidenceRegistryEdit) => Promise<void>;
}) {
  const [category, setCategory] = useState(evidence.category);
  const [title, setTitle] = useState(evidence.title);
  const [technologies, setTechnologies] = useState(
    evidence.technologies.join(", "),
  );
  const [capabilities, setCapabilities] = useState(
    evidence.capabilities.join(", "),
  );
  const [claims, setClaims] = useState(evidence.approvedClaims.join("\n"));
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const approvedClaims = splitLines(claims);

    if (title.trim() === "" || approvedClaims.length === 0) {
      setValidationError("Keep a title and at least one grounded claim.");
      return;
    }

    setValidationError(null);
    await onSave({
      category,
      title: title.trim(),
      technologies: splitCommaSeparated(technologies),
      capabilities: splitCommaSeparated(capabilities),
      approvedClaims,
    });
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Category
          <select
            aria-label="Evidence category"
            className="border-input bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as RegistryEvidence["category"])
            }
          >
            {EVIDENCE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Title
          <input
            className="border-input bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm"
            value={title}
            maxLength={250}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Technologies
        <input
          className="border-input bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm"
          value={technologies}
          placeholder="Python, FastAPI, PostgreSQL"
          onChange={(event) => setTechnologies(event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium">
        Capabilities
        <input
          className="border-input bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm"
          value={capabilities}
          placeholder="API development, testing"
          onChange={(event) => setCapabilities(event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium">
        Approved claims
        <textarea
          className="border-input bg-background mt-2 min-h-32 w-full rounded-xl border px-3 py-2 text-sm leading-6"
          value={claims}
          onChange={(event) => setClaims(event.target.value)}
        />
        <span className="text-muted-foreground mt-1 block text-xs">
          One source-grounded claim per line.
        </span>
      </label>

      {validationError !== null && (
        <p role="alert" className="text-destructive text-sm">
          {validationError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          Save evidence
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TagSection({ title, values }: { title: string; values: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">None recorded.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="bg-muted rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {value}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function splitCommaSeparated(value: string): string[] {
  return uniqueValues(value.split(","));
}

function splitLines(value: string): string[] {
  return uniqueValues(value.split("\n"));
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function mutationMessage(error: unknown): string {
  return error instanceof EvidenceApiError
    ? error.message
    : "The evidence record could not be updated.";
}
