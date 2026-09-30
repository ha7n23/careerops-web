# CareerOps Web

The production web workspace for CareerOps: an evidence-grounded platform for
building, reviewing and exporting stronger job applications.

This repository is Module 3 of the CareerOps platform. It provides the browser
experience and a Next.js backend-for-frontend boundary. The browser never talks
to the Agent Engine directly and never receives private service credentials.

## Platform boundary

```text
Browser -> CareerOps Web (Module 3) -> Automation & MCP Hub (Module 2)
                                      -> Agent Engine (Module 1)
```

- Module 3 owns presentation, browser-safe validation and web session context.
- Module 2 is the authenticated automation and integration gateway.
- Module 1 owns evidence extraction, grounded analysis and final-CV generation.

## Current capabilities

- Application creation, filtering and durable detail views.
- Evidence-grounded job preparation and analysis recovery.
- Human review controls for generated CV proposals.
- Pending-action dashboard.
- Evidence intake, durable human review and duplicate resolution.
- Approved Evidence Registry search, filtering, editing and lifecycle control.
- Loading, empty, error and retry states.
- Route-level loading, not-found and unexpected-error recovery.
- Server-only MCP and REST gateway clients with runtime contract validation.

Evidence intake, human review, Evidence Registry lifecycle management,
job-analysis review and verified final-CV delivery are available. Final CV
generation is gated on an approved or edited proposal set and exposes secure
DOCX/PDF downloads through the server-only Module 2 boundary.

## Local development

Requirements:

- Node.js 24
- npm 11+
- CareerOps Module 1 running locally on port `8000`
- CareerOps Module 2 running locally on port `8001`

Install dependencies and configure the environment:

```bash
npm ci
cp .env.example .env.local
```

Start Module 1 from its repository and verify its readiness endpoint:

```bash
docker compose up -d --build
curl http://localhost:8000/ready
```

Start Module 2 from its repository:

```bash
uv run --env-file .env python scripts/run_dev_mcp_server.py
```

Start the web application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Module 2 development launcher accepts `careerops-local-dev-token` for both
MCP and REST requests. Both credentials stay in server-only environment
variables and must never use a `NEXT_PUBLIC_` prefix. Deployed environments
must replace the local token with a real user access token.

## MVP browser proof

With all three modules running, prove the complete user-controlled path:

1. Open **Evidence**, upload or paste career evidence and complete its review.
2. Confirm the approved record appears in the active Evidence Registry.
3. Create an application, prepare its job analysis and review every CV proposal.
4. Select a source CV and generate the final version.
5. Download both verified DOCX and PDF artifacts and open them locally.
6. Repeat generation and confirm the existing version is reused safely.

At no point should CareerOps claim that an application was submitted. Blocked or
failed generation must not display download links.

## Quality gates

```bash
npm run check
npm run build
```

`npm run check` runs Prettier verification, ESLint, Next.js type generation,
TypeScript and the Vitest suite. GitHub Actions runs both commands for every
pull request and push to `main`.

## Frozen MVP contract

- [Platform architecture](docs/ARCHITECTURE.md)
- [Module 3 MVP contract](docs/MVP_CONTRACT.md)

## Technology

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS 4 and shadcn/radix primitives
- TanStack Query, React Hook Form and Zod
- Vitest and React Testing Library
