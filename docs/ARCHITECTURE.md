# CareerOps Web Architecture

## Purpose

CareerOps Web is Module 3 of the platform. It owns the browser experience and
the backend-for-frontend boundary; it does not own evidence extraction, job
analysis, CV generation or external application submission.

```text
Browser
  -> Module 3: Next.js web and browser-safe API routes
      -> Module 2: authenticated Automation & MCP Hub REST/MCP gateway
      -> Module 2: authenticated OpenClaw assistant gateway
          -> Module 1: Agent Engine and document pipeline
```

## Ownership

| Layer           | Owns                                                     | Must not own                                      |
| --------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Browser UI      | Forms, review decisions, loading/error states, downloads | Service credentials or direct Agent Engine access |
| Module 3 server | Session context, input validation, response shaping      | Career evidence or workflow persistence           |
| Module 2        | REST/MCP gateway, OpenClaw orchestration and MCP tools   | Browser presentation                              |
| Module 1        | Evidence, job analysis, review state and CV artifacts    | Web sessions or browser rendering                 |

Module 3 treats Module 2 as its only service boundary. MCP, REST and OpenClaw
access tokens are server-only environment variables; no credential uses a
`NEXT_PUBLIC_` prefix.

## Assistant flow

1. The browser sends bounded text to Module 3's assistant route.
2. Module 3 assigns an opaque HttpOnly conversation cookie and calls OpenClaw's
   authenticated Chat Completions endpoint server-to-server.
3. OpenClaw may use only the committed CareerOps MCP tool allowlist.
4. Module 3 validates the response contract and renders it as plain text.
5. Starting a new conversation expires the opaque cookie; OpenClaw history is
   never treated as authoritative business state.

The gateway bearer token is a full operator credential. The OpenClaw port must
remain on private ingress and the token must never be sent to browser code.

## Application flow

1. The browser creates or selects an application through Module 3.
2. Module 2 asks Module 1 to analyse the job description against active,
   approved evidence.
3. Module 3 displays requirements, evidence matches, gaps and CV proposals.
4. A human approves, edits, rejects or requests regeneration.
5. Only an approved or edited review can request final-CV generation.
6. Module 1 assembles and verifies DOCX/PDF artifacts. Module 3 streams their
   downloads through the authenticated Module 2 boundary.

## Evidence flow

1. A document or pasted text is ingested.
2. Extracted proposals remain outside the Evidence Registry until a human
   decision is completed.
3. Approved records become active grounding material.
4. Archived evidence is recoverable but excluded from default registry queries
   and job-analysis grounding.
5. Restored evidence becomes active and usable again.

## Failure model

- Expected gateway failures are converted into browser-safe JSON errors.
- Mutations use idempotency or deterministic reuse where the upstream contract
  supports it.
- UI retries never imply that an earlier request succeeded.
- Download links are shown only for artifacts reported as verified.
- Unexpected render failures fall back to a route-level recovery screen without
  exposing internal error messages.
- Assistant requests use bounded input, private no-store responses, an explicit
  timeout and browser-safe error mapping.

## Deployment boundary

The current local MVP uses a development access token. A deployed environment
must replace it with an authenticated user session that supplies scoped Module
2 credentials and isolates the opaque assistant conversation per user. Module
3 must remain the only browser-facing service; the OpenClaw operator endpoint
must remain private.
