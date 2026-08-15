# Contest Autopsy

## Scope

P1-907 turns an owner-authorized terminal contest session into a chronological
review artifact. It is available only for `completed` or `expired` sessions;
active and draft sessions return an explicit unavailable state rather than a
partial retrospective.

## Factual review contract

| Section             | Durable evidence                                                             |
| ------------------- | ---------------------------------------------------------------------------- |
| Terminal outcome    | Session status: all items resolved or deadline materialized as expired.      |
| Ordered trace       | Persisted item position, terminal status and canonical problem reference.    |
| Completion time     | Item `completedAt` minus session `startedAt` when both timestamps are valid. |
| Unresolved evidence | `skipped`, `queued` or `active` item status at the terminal state.           |
| Summary snapshot    | Existing factual score, elapsed-time penalty and performance measures.       |

The autopsy does not infer a cause for a skip, a mistake, a solution quality,
rank, rating, skill, or strategic conclusion. It does not persist a separate
copy of problem titles, notes, source code or attempt text; it projects only the
owner-authorized contest detail already stored by the lifecycle.
