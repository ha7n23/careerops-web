"use client";

import { FileText, FileUp, LoaderCircle, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EvidenceApiError } from "@/features/evidence/browser-api";
import { useStartEvidenceIntake } from "@/features/evidence/use-evidence";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function EvidenceIntakeForm({
  onReviewStarted,
}: {
  onReviewStarted: (reviewRunId: string) => void;
}) {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intake = useStartEvidenceIntake();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationMessage(null);

    if (mode === "file") {
      if (
        file === null ||
        file.size === 0 ||
        file.size > MAX_UPLOAD_BYTES ||
        !ALLOWED_FILE_TYPES.has(file.type)
      ) {
        setValidationMessage(
          "Choose a non-empty PDF or DOCX file no larger than 5 MiB.",
        );
        return;
      }
    } else if (title.trim() === "" || content.trim() === "") {
      setValidationMessage("Enter a title and evidence text.");
      return;
    }

    try {
      const review = await intake.mutateAsync(
        mode === "file"
          ? { kind: "file", file: file as File }
          : {
              kind: "text",
              input: { title: title.trim(), content: content.trim() },
            },
      );

      onReviewStarted(review.reviewRunId);
      setTitle("");
      setContent("");
      setFile(null);

      if (fileInputRef.current !== null) {
        fileInputRef.current.value = "";
      }
    } catch {
      // The mutation error is rendered below and the durable source remains
      // recoverable from Recent sources if extraction did not start.
    }
  }

  const errorMessage =
    intake.error instanceof EvidenceApiError
      ? intake.error.message
      : intake.isError
        ? "CareerOps could not start the evidence review."
        : null;

  return (
    <section className="bg-card overflow-hidden rounded-3xl border shadow-sm">
      <div className="border-b px-6 py-5 sm:px-7">
        <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
          New evidence
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Add a trusted source
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Nothing enters your registry until you review and approve it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-7">
        <div
          role="tablist"
          aria-label="Evidence source type"
          className="bg-muted grid grid-cols-2 rounded-xl p-1"
        >
          <SourceTab
            active={mode === "file"}
            icon={FileUp}
            label="Upload file"
            onClick={() => setMode("file")}
          />
          <SourceTab
            active={mode === "text"}
            icon={FileText}
            label="Paste text"
            onClick={() => setMode("text")}
          />
        </div>

        {mode === "file" ? (
          <div>
            <label htmlFor="evidence-file" className="text-sm font-medium">
              CV or evidence document
            </label>
            <label
              htmlFor="evidence-file"
              className="border-border hover:border-primary/40 hover:bg-primary/3 mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-7 text-center transition-colors"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                <FileUp aria-hidden="true" className="size-5" />
              </span>
              <span className="mt-3 text-sm font-medium">
                {file === null ? "Choose a PDF or DOCX" : file.name}
              </span>
              <span className="text-muted-foreground mt-1 text-xs">
                Maximum file size: 5 MiB
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="evidence-file"
              name="file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                setValidationMessage(null);
                setFile(event.target.files?.[0] ?? null);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="evidence-title" className="text-sm font-medium">
                Source title
              </label>
              <input
                id="evidence-title"
                value={title}
                maxLength={250}
                placeholder="CareerOps project notes"
                onChange={(event) => setTitle(event.target.value)}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="evidence-content"
                  className="text-sm font-medium"
                >
                  Evidence text
                </label>
                <span className="text-muted-foreground text-xs">
                  {content.length.toLocaleString()} / 30,000
                </span>
              </div>
              <textarea
                id="evidence-content"
                value={content}
                maxLength={30_000}
                rows={8}
                placeholder="Describe the project, role, technologies and outcomes using factual source material."
                onChange={(event) => setContent(event.target.value)}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-3"
              />
            </div>
          </div>
        )}

        {(validationMessage !== null || errorMessage !== null) && (
          <p
            role="alert"
            className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
          >
            {validationMessage ?? errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={intake.isPending}
          className="w-full rounded-xl"
        >
          {intake.isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {intake.isPending
            ? "Extracting evidence…"
            : "Extract evidence for review"}
        </Button>
      </form>
    </section>
  );
}

function SourceTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof FileUp;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-3",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
