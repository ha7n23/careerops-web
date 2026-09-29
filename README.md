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
- Loading, empty, error and retry states.
- Server-only MCP and REST gateway clients with runtime contract validation.

Evidence intake, the approved Evidence Registry and final-CV downloads are the
next product slices.

## Local development

Requirements:

- Node.js 24
- npm 11+
- CareerOps Module 2 running locally on port `8001`

Install dependencies and configure the environment:

```bash
npm ci
cp .env.example .env.local
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

The existing application workflow uses the local development MCP endpoint.
Authenticated Module 2 REST workflows additionally require
`CAREEROPS_API_ACCESS_TOKEN`. Both credentials stay in server-only environment
variables and must never use a `NEXT_PUBLIC_` prefix.

## Quality gates

```bash
npm run check
npm run build
```

`npm run check` runs Prettier verification, ESLint, Next.js type generation,
TypeScript and the Vitest suite. GitHub Actions runs both commands for every
pull request and push to `main`.

## Technology

- Next.js 16 App Router and React 19
- TypeScript, Tailwind CSS 4 and shadcn/radix primitives
- TanStack Query, React Hook Form and Zod
- Vitest and React Testing Library
