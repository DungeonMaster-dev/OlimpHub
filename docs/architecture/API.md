# API Contracts — OlimpHub

**Status:** implemented baseline  
**Date:** 2026-08-14

OlimpHub uses typed tRPC procedures under `/api/trpc`. Browser clients do not call the database or Codeforces directly. All personal workspace procedures require a validated Manus session through `protectedProcedure`; every read and mutation scopes personal records by `ctx.user.id`.

| Module     | Core procedures                                              | Server-enforced guarantee                                                                                     |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Dashboard  | `olimp.dashboard`                                            | Returns only the authenticated user's attempts and activity.                                                  |
| Catalogue  | `olimp.catalogue.list`, `detail`                             | Exposes source metadata and external links; no mirrored statement content is required.                        |
| Workspace  | `start`, `setAttemptState`, `setStatus`, `notes`, `saveNote` | Attempts and notes are owned by the current user.                                                             |
| Hints      | `workspace.nextHint`                                         | The client supplies only an owned attempt ID; the server calculates and persists exactly the next hint level. |
| Training   | `training.list`, `create`, `detail`, `updateItem`            | Session ownership is validated before item state changes.                                                     |
| Progress   | `analytics.summary`                                          | Returns a selected period, calculation version, deterministic metrics and explicit evidence reasons.          |
| Settings   | `settings.get`, `update`, `setCodeforcesHandle`              | Preferences and linked handle are private and user-scoped.                                                    |
| Codeforces | `codeforces.syncCatalogue`, `syncSubmissions`                | Uses the official API from the server, records sync status, and enforces a one-minute scope cooldown.         |

The public `GET /api/healthz` endpoint reports process liveness. `GET /api/readyz` additionally executes a bounded database query and returns `503` when the application cannot use its persistence layer. Health responses do not disclose account, configuration or source data.

Codeforces catalogue refresh is user-initiated for the current first release. Periodic synchronization is deliberately deferred until the deployed callback workflow has been enabled and tested; there are no in-process timers.

## References

[1]: https://codeforces.com/apiHelp "Codeforces API — official reference"
[2]: https://trpc.io/docs "tRPC documentation"
