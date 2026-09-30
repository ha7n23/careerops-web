# Module 3 MVP Contract

This document freezes the browser and backend-for-frontend behaviour supported
by the CareerOps MVP.

## Browser routes

| Route                           | Contract                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| `/`                             | Workflow overview, pending actions and recent applications          |
| `/evidence`                     | Evidence intake, review, duplicate decisions and registry lifecycle |
| `/applications`                 | Create, filter and open applications                                |
| `/applications/[applicationId]` | Prepare, inspect, review and generate a final CV                    |

Invalid routes and malformed application identifiers render a safe not-found
state. Unexpected route errors render a retryable fallback without exposing
internal exception messages.

## Backend-for-frontend routes

| Method         | Route                                                       | Purpose                                     |
| -------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `GET`, `POST`  | `/api/applications`                                         | List and create applications                |
| `GET`          | `/api/applications/[applicationId]`                         | Retrieve durable application state          |
| `POST`         | `/api/applications/[applicationId]/prepare`                 | Start evidence-grounded analysis            |
| `GET`          | `/api/applications/[applicationId]/analysis`                | Recover the latest analysis                 |
| `POST`         | `/api/applications/[applicationId]/review`                  | Submit a human proposal decision            |
| `GET`          | `/api/actions/pending`                                      | Retrieve pending human actions              |
| `GET`, `POST`  | `/api/evidence/documents`                                   | List, upload or paste evidence              |
| `POST`         | `/api/evidence/documents/[documentId]/review`               | Start evidence review                       |
| `GET`          | `/api/evidence/reviews`                                     | List durable review runs                    |
| `GET`          | `/api/evidence/reviews/[reviewRunId]`                       | Recover one review                          |
| `POST`         | `/api/evidence/reviews/[reviewRunId]/decision`              | Complete evidence decisions                 |
| `GET`          | `/api/evidence/registry`                                    | Search and paginate evidence                |
| `GET`, `PATCH` | `/api/evidence/registry/[evidenceId]`                       | Read or edit approved evidence              |
| `POST`         | `/api/evidence/registry/[evidenceId]/lifecycle`             | Archive or restore evidence                 |
| `POST`         | `/api/cv-versions`                                          | Generate or safely reuse a final CV version |
| `GET`          | `/api/cv-versions/[cvVersionId]`                            | Retrieve CV version metadata                |
| `GET`          | `/api/cv-versions/[cvVersionId]/artifacts/[artifactFormat]` | Download verified DOCX/PDF                  |

All private responses use `Cache-Control: private, no-store`. Browser requests
never contain Module 1 or Module 2 service credentials.

## Safety invariants

1. The Evidence Registry contains only human-approved evidence.
2. Archived evidence is not used for new job analysis.
3. CV proposals require an explicit human decision.
4. Final-CV generation requires an approved or edited proposal review.
5. Only verified artifacts receive download links.
6. Generation never means submission; CareerOps does not submit applications in
   this MVP.
7. A failed or ambiguous mutation cannot be presented as successful.
8. Cross-user isolation and source-of-truth enforcement remain upstream Module
   1 and Module 2 responsibilities and are never bypassed by Module 3.

## Error contract

| Condition                 | Browser behaviour                                                       |
| ------------------------- | ----------------------------------------------------------------------- |
| Invalid input             | Reject before calling Module 2 and preserve entered data where possible |
| Authentication failure    | Explain that the session must be restored; do not retry automatically   |
| Workflow conflict         | Ask the user to refresh the latest durable state before retrying        |
| Upstream outage           | Preserve confirmed state and offer an explicit retry                    |
| Invalid upstream response | Treat the operation as unconfirmed and show no success UI               |
| Missing resource          | Render a safe not-found state                                           |

## Deliberate MVP exclusions

- Employer-site submission or browser automation.
- Claims inferred without approved evidence.
- OCR-only evidence extraction.
- Client-side storage of service credentials.
- Treating a generated file as proof that an application was submitted.

## Release proof

The contract is ready to release when `npm run check` and `npm run build` pass,
and the README browser proof succeeds against healthy local Module 1 and Module
2 services.
