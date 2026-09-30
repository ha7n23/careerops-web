"use client";

import {
  CircleAlert,
  Download,
  FileCheck2,
  FileLock2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ApplicationAnalysis } from "@/features/applications/analysis-contracts";
import { useEvidenceDocuments } from "@/features/evidence/use-evidence";
import type { FinalCvVersion } from "@/features/final-cv/contracts";
import { presentFinalCvError } from "@/features/final-cv/presentation";
import { useGenerateFinalCv } from "@/features/final-cv/use-final-cv";

type FinalCvDeliveryPanelProps = {
  analysis: ApplicationAnalysis["analysis"];
};

export function FinalCvDeliveryPanel({ analysis }: FinalCvDeliveryPanelProps) {
  if (analysis.status === "awaiting_review") {
    return (
      <DeliveryNotice
        title="Final CV awaits your decision"
        description="Approve or edit the verified proposals above before CareerOps can assemble downloadable documents."
      />
    );
  }

  if (
    analysis.reviewStatus !== "approved" &&
    analysis.reviewStatus !== "edited"
  ) {
    const blockedCount = analysis.blockedProposalIds.length;

    return (
      <section
        aria-labelledby="final-cv-title"
        className="border-destructive/20 bg-destructive/5 rounded-2xl border p-6"
      >
        <div className="flex items-start gap-4">
          <div className="bg-background rounded-xl border p-3">
            <FileLock2 aria-hidden="true" className="size-5" />
          </div>

          <div>
            <p className="text-destructive text-sm font-medium">
              Generation safely blocked
            </p>
            <h3 id="final-cv-title" className="mt-1 text-lg font-semibold">
              No final CV was created
            </h3>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              {blockedCount > 0
                ? `${blockedCount} unsupported ${blockedCount === 1 ? "proposal was" : "proposals were"} excluded. CareerOps will not generate a document from unapproved wording.`
                : "The proposal review did not approve wording for a final CV. No document was generated or submitted externally."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <ApprovedFinalCvDelivery analysis={analysis} />;
}

function ApprovedFinalCvDelivery({ analysis }: FinalCvDeliveryPanelProps) {
  const documents = useEvidenceDocuments();
  const generation = useGenerateFinalCv();
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [version, setVersion] = useState<FinalCvVersion | null>(null);

  const sourceDocuments =
    documents.data?.items.filter(
      (document) =>
        document.documentFormat !== "text" && document.status !== "quarantined",
    ) ?? [];

  const effectiveDocumentId =
    selectedDocumentId === ""
      ? (sourceDocuments[0]?.documentId ?? "")
      : selectedDocumentId;

  const errorPresentation =
    generation.error === null ? null : presentFinalCvError(generation.error);

  async function generate() {
    if (effectiveDocumentId === "") {
      return;
    }

    try {
      const generated = await generation.mutateAsync({
        threadId: analysis.threadId,
        sourceDocumentId: effectiveDocumentId,
      });
      setVersion(generated);
    } catch {
      // The mutation exposes its safe browser-facing error below.
    }
  }

  return (
    <section
      aria-labelledby="final-cv-title"
      className="bg-card rounded-2xl border p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-muted rounded-xl p-3">
            <FileCheck2
              aria-hidden="true"
              className="text-muted-foreground size-5"
            />
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Document delivery</p>
            <h3 id="final-cv-title" className="mt-1 text-lg font-semibold">
              Generate final CV
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Build verified DOCX and PDF artifacts from the approved proposal
              set. Repeating the same request safely reuses its existing CV
              version.
            </p>
          </div>
        </div>

        <span className="flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          Human approved
        </span>
      </div>

      {documents.isPending ? (
        <div
          role="status"
          className="bg-muted mt-6 h-24 animate-pulse rounded-xl"
        >
          <span className="sr-only">Loading source CVs…</span>
        </div>
      ) : documents.isError ? (
        <div role="alert" className="mt-6 rounded-xl border p-4">
          <p className="text-sm font-medium">Source CVs could not be loaded</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={documents.isFetching}
            onClick={() => void documents.refetch()}
          >
            <RefreshCw
              aria-hidden="true"
              className={documents.isFetching ? "animate-spin" : undefined}
            />
            Try again
          </Button>
        </div>
      ) : sourceDocuments.length === 0 ? (
        <div className="bg-muted/30 mt-6 rounded-xl border p-4">
          <p className="text-sm font-medium">Add a source CV first</p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Upload a DOCX or PDF in Evidence, complete its review, then return
            here to generate the tailored version.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/evidence">Open Evidence</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="source-cv" className="text-sm font-medium">
              Source CV
            </label>
            <select
              id="source-cv"
              value={effectiveDocumentId}
              disabled={generation.isPending}
              onChange={(event) => {
                setSelectedDocumentId(event.target.value);
                setVersion(null);
              }}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
            >
              {sourceDocuments.map((document) => (
                <option key={document.documentId} value={document.documentId}>
                  {document.originalFilename} ·{" "}
                  {document.documentFormat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            disabled={generation.isPending}
            onClick={() => void generate()}
          >
            {generation.isPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {generation.isPending
              ? "Generating documents"
              : "Generate final CV"}
          </Button>
        </div>
      )}

      {errorPresentation !== null && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/20 bg-destructive/5 mt-5 flex items-start gap-3 rounded-xl border p-4"
        >
          <CircleAlert
            aria-hidden="true"
            className="text-destructive mt-0.5 size-4 shrink-0"
          />
          <div>
            <p className="text-sm font-medium">{errorPresentation.title}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {errorPresentation.description}
            </p>
          </div>
        </div>
      )}

      {version !== null && <FinalCvVersionCard version={version} />}
    </section>
  );
}

function FinalCvVersionCard({ version }: { version: FinalCvVersion }) {
  const verifiedArtifacts = version.artifacts.filter(
    (artifact) => artifact.verificationStatus === "verified",
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-xl border p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            {version.reusedExistingVersion
              ? "Existing CV version reused"
              : "Final CV generated"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Version {version.versionNumber} · {version.status} · template{" "}
            {version.templateVersion}
          </p>
        </div>

        <span className="bg-muted text-muted-foreground w-fit rounded-full px-3 py-1 font-mono text-xs">
          {version.cvVersionId}
        </span>
      </div>

      {verifiedArtifacts.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Artifact verification has not completed. Downloads remain disabled.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          {verifiedArtifacts.map((artifact) => (
            <Button key={artifact.artifactId} asChild variant="outline">
              <a
                href={`/api/cv-versions/${encodeURIComponent(version.cvVersionId)}/artifacts/${artifact.artifactFormat}`}
                download
              >
                <Download aria-hidden="true" />
                Download {artifact.artifactFormat.toUpperCase()} ·{" "}
                {formatBytes(artifact.sizeBytes)}
              </a>
            </Button>
          ))}
        </div>
      )}

      <p className="text-muted-foreground mt-4 text-xs leading-5">
        Downloads stay inside the authenticated CareerOps boundary. Generating
        this CV does not submit an application or send either file externally.
      </p>
    </div>
  );
}

function DeliveryNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section
      aria-labelledby="final-cv-title"
      className="bg-card rounded-2xl border p-6 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="bg-muted rounded-xl p-3">
          <FileLock2
            aria-hidden="true"
            className="text-muted-foreground size-5"
          />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Document delivery</p>
          <h3 id="final-cv-title" className="mt-1 text-lg font-semibold">
            {title}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}
