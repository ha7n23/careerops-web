"use client";

import { Bot, Plus, RotateCcw, Send, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  AssistantApiError,
  resetAssistantSession,
  sendAssistantMessage,
} from "@/features/assistant/browser-api";
import {
  assistantMessageSchema,
  type AssistantMessage,
} from "@/features/assistant/contracts";

const transcriptStorageKey = "careerops.assistant.transcript.v1";
const maximumStoredMessages = 50;

const suggestedPrompts = [
  "Show my approved evidence.",
  "What actions need my attention?",
  "List my current applications.",
] as const;

export function AssistantWorkspace() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        setMessages(readStoredTranscript());
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      window.localStorage.setItem(
        transcriptStorageKey,
        JSON.stringify(messages.slice(-maximumStoredMessages)),
      );
    }

    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function submitMessage(
    message: string,
    { appendUserMessage = true } = {},
  ): Promise<void> {
    const normalizedMessage = message.trim();

    if (normalizedMessage.length === 0 || isSending) {
      return;
    }

    if (appendUserMessage) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: normalizedMessage,
        },
      ]);
    }

    setDraft("");
    setErrorMessage(null);
    setFailedMessage(null);
    setIsSending(true);

    try {
      const response = await sendAssistantMessage(normalizedMessage);
      setMessages((currentMessages) => [...currentMessages, response.message]);
    } catch (error) {
      if (error instanceof AssistantApiError) {
        setFailedMessage(error.retryable ? normalizedMessage : null);
        setErrorMessage(error.message);
      } else {
        setFailedMessage(normalizedMessage);
        setErrorMessage("The assistant could not complete that request.");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(draft);
  }

  async function startNewConversation() {
    if (isSending || isResetting) {
      return;
    }

    setIsResetting(true);
    setErrorMessage(null);

    try {
      await resetAssistantSession();
      window.localStorage.removeItem(transcriptStorageKey);
      setMessages([]);
      setFailedMessage(null);
      setDraft("");
    } catch (error) {
      setErrorMessage(
        error instanceof AssistantApiError
          ? error.message
          : "A new conversation could not be started.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <section className="border-border/70 bg-card/90 overflow-hidden rounded-3xl border shadow-sm">
      <div className="border-border/70 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-2xl">
            <Bot aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">
              CareerOps assistant
            </h2>
            <p className="text-muted-foreground text-xs">
              Connected through the governed OpenClaw tool surface
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          disabled={isSending || isResetting}
          className="border-border bg-background hover:bg-muted focus-visible:ring-ring/50 inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus aria-hidden="true" className="size-4" />
          {isResetting ? "Starting…" : "New conversation"}
        </button>
      </div>

      <div
        aria-live="polite"
        aria-label="Assistant conversation"
        className="min-h-[25rem] space-y-5 overflow-y-auto px-5 py-6 sm:max-h-[38rem] sm:px-8"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-[20rem] max-w-xl flex-col items-center justify-center text-center">
            <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
              <Bot aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              Ask about your CareerOps workspace
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
              The assistant can use your approved evidence, applications and
              pending actions through the existing CareerOps tools.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  disabled={isSending}
                  onClick={() => submitMessage(prompt)}
                  className="border-border bg-background hover:bg-muted focus-visible:ring-ring/50 rounded-xl border px-3.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isSending && (
          <div className="flex items-start gap-3">
            <MessageAvatar role="assistant" />
            <div className="bg-muted text-muted-foreground rounded-2xl rounded-tl-md px-4 py-3 text-sm">
              Working with CareerOps…
            </div>
          </div>
        )}

        {errorMessage !== null && (
          <div
            role="alert"
            className="border-destructive/20 bg-destructive/5 rounded-2xl border p-4"
          >
            <p className="text-sm font-medium">{errorMessage}</p>
            {failedMessage !== null && (
              <button
                type="button"
                disabled={isSending}
                onClick={() =>
                  submitMessage(failedMessage, { appendUserMessage: false })
                }
                className="text-primary focus-visible:ring-ring/50 mt-3 inline-flex items-center gap-2 rounded-lg text-sm font-semibold outline-none focus-visible:ring-3"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Try again
              </button>
            )}
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      <div className="border-border/70 bg-muted/30 border-t p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <label htmlFor="assistant-message" className="sr-only">
            Message CareerOps assistant
          </label>
          <textarea
            id="assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4_000}
            rows={2}
            placeholder="Ask about evidence, applications or next actions…"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-12 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
          />
          <button
            type="submit"
            disabled={isSending || draft.trim().length === 0}
            aria-label="Send message"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send aria-hidden="true" className="size-4" />
          </button>
        </form>

        <div className="text-muted-foreground mt-3 flex items-start gap-2 text-xs leading-5">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          <p>
            Uses approved CareerOps tools and evidence. It cannot submit job
            applications automatically. Confirm important actions in their
            normal workspace.
          </p>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <MessageAvatar role="assistant" />}
      <p
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap sm:max-w-[75%] ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-muted text-foreground rounded-tl-md"
        }`}
      >
        {message.content}
      </p>
      {isUser && <MessageAvatar role="user" />}
    </div>
  );
}

function MessageAvatar({ role }: { role: AssistantMessage["role"] }) {
  const Icon = role === "assistant" ? Bot : User;

  return (
    <span className="bg-background text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm">
      <Icon aria-hidden="true" className="size-4" />
    </span>
  );
}

function readStoredTranscript(): AssistantMessage[] {
  try {
    const storedTranscript = window.localStorage.getItem(transcriptStorageKey);

    if (storedTranscript === null) {
      return [];
    }

    const parsedTranscript = assistantMessageSchema
      .array()
      .max(maximumStoredMessages)
      .safeParse(JSON.parse(storedTranscript));

    return parsedTranscript.success ? parsedTranscript.data : [];
  } catch {
    return [];
  }
}
