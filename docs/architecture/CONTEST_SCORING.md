# Virtual Contest Scoring

## Scope

P1-903 projects factual score and penalty values from persisted virtual contest
lifecycle facts. It introduces no external verdict ingestion, source-code
analysis, rank, rating or performance conclusion.

## Policy: `completion-time-v1`

| Fact            | Rule                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Base points     | Every explicitly completed contest item is worth **100** points. P1-904 may introduce an explicit problem-selection/weight policy later.   |
| Completed items | Only items whose persisted status is `completed` contribute points. `skipped`, `queued` and `active` items contribute zero.                |
| Time penalty    | Each completed item contributes the elapsed whole minutes from `startedAt` to its persisted `completedAt`, rounded up and clamped at zero. |
| Total score     | Completed item count × 100.                                                                                                                |
| Total penalty   | Sum of completed-item elapsed penalty minutes.                                                                                             |

The projection is available only once a session has a persisted `startedAt`.
Missing or invalid completion timestamps contribute neither points nor penalty;
this signals incomplete evidence rather than being interpreted as a result.

## Boundary

`completion-time-v1` intentionally does **not** apply wrong-attempt penalties:
the current lifecycle does not persist a contest-attempt count, and inventing
one would fabricate evidence. A later policy may add that factor only after a
durable, owner-scoped source for those facts exists.
