# API Contracts — OlimpHub

**Status:** implemented baseline  
**Date:** 2026-08-14

OlimpHub uses typed tRPC procedures under `/api/trpc`. Browser clients do not call the database or Codeforces directly. All personal workspace procedures require a validated Manus session through `protectedProcedure`; every read and mutation scopes personal records by `ctx.user.id`.

| Module             | Core procedures                                              | Server-enforced guarantee                                                                                                                        |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard          | `olimp.dashboard`                                            | Returns only the authenticated user's attempts and activity.                                                                                     |
| Catalogue          | `olimp.catalogue.list`, `detail`                             | Exposes source metadata and external links; no mirrored statement content is required.                                                           |
| Workspace          | `start`, `setAttemptState`, `setStatus`, `notes`, `saveNote` | Attempts and notes are owned by the current user.                                                                                                |
| Hints              | `workspace.nextHint`                                         | The client supplies only an owned attempt ID; the server calculates and persists exactly the next hint level.                                    |
| Training           | `training.list`, `create`, `detail`, `updateItem`            | Session ownership is validated before item state changes.                                                                                        |
| Progress           | `analytics.summary`                                          | Returns a selected period, calculation version, deterministic metrics and explicit evidence reasons.                                             |
| Settings           | `settings.get`, `update`, `setCodeforcesHandle`              | Preferences and linked handle are private and user-scoped.                                                                                       |
| Codeforces         | `codeforces.syncCatalogue`, `syncSubmissions`                | Uses the official API from the server, records sync status, and enforces a one-minute scope cooldown.                                            |
| Submission history | `submissions.list`                                           | Returns only the authenticated user's imported public verdicts, supports verdict filtering, and joins canonical problem metadata when available. |
| Canonicalization   | `canonicalization.proposeRelation`, `reviewRelation`         | Admin-only, nondestructive review flow; it preserves every source problem and all personal history rather than merging rows.                     |

External-source traffic crosses a dedicated adapter boundary. `ProblemSourceAdapter` produces normalized source-neutral problem and submission records plus a typed source outcome; the application router persists successful results and records failed source runs without treating a provider error as an empty dataset.

The public `GET /api/healthz` endpoint reports process liveness. `GET /api/readyz` additionally executes a bounded database query and returns `503` when the application cannot use its persistence layer. Health responses do not disclose account, configuration or source data.

Retry-sensitive note saves and training-session creation accept a UUID `requestId`. The server stores a durable receipt keyed by `(user, operation, requestId)`: the first request owns execution, a completed retry receives the original response, and a concurrent duplicate is rejected without creating a second personal record. Activity events additionally use deterministic unique event IDs, while unchanged attempt transitions and terminal training items are no-ops.

Codeforces catalogue refresh is user-initiated for the current first release. Periodic synchronization is deliberately deferred until the deployed callback workflow has been enabled and tested; there are no in-process timers.

Canonicalization accepts only explicit, normalized pairs of two different existing problems. A proposal may mark duplicate evidence as pending; only approval of a `same_problem` relation marks the pair as linked. After every proposal or review decision, status is reconciled from all remaining active duplicate relations, so a rejected proposal cannot leave a stale candidate flag. The API never infers a relation from a title, tag set, or URL alone, and never rewrites `problemId` in attempts, training items, progress, notes, or external submissions.

## References

[1]: https://codeforces.com/apiHelp "Codeforces API — official reference"
[2]: https://trpc.io/docs "tRPC documentation"
