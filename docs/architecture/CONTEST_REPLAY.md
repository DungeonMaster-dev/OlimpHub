# Contest Replay

## Scope

P1-908 is a private, read-only review of a terminal (`completed` or `expired`)
contest. It does not restart a session, make a mutation, simulate elapsed time,
or reconstruct actions that were not persisted.

## Replay frames

Each frame corresponds to one persisted ordered contest item and contains only:

| Field                       | Evidence                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Frame position              | Persisted `contest_items.position`.                                                     |
| Canonical problem reference | Owner-authorized item/problem relation already returned by contest detail.              |
| Recorded terminal state     | Item `completed`, `skipped`, `active` or `queued` status at the terminal session state. |
| Completion clock            | `completedAt - startedAt` only for a valid persisted completion timestamp.              |
| Evidence availability       | Explicit `recorded` or `unavailable` marker.                                            |

The projection is unavailable before terminal state. UI navigation only changes a
local frame index; it cannot submit an update, score a problem, reveal a
solution, infer a missing completion time, or alter the contest lifecycle.
