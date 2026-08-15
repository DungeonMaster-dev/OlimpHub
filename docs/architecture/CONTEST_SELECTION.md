# Virtual Contest Problem Selection

## Scope

P1-904 provides a deterministic, editable contest-creation suggestion. It does
not create a contest automatically and does not claim that the proposed set is
optimal or personalized beyond its explicit persisted reasons.

## Eligibility and order

| Rule                                | Evidence source                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| Exclude terminal personal work      | Owner-scoped problem progress with `solved`, `skipped` or `archived` status. |
| Exclude active contest duplicates   | Owner-scoped `contest_items` belonging to an `active` contest.               |
| Prioritize unfinished personal work | Owner-scoped `in_progress`, `paused`, `planned` or `review` progress status. |
| Fallback to catalogue availability  | Canonical catalogue problems without disqualifying owner evidence.           |
| Deterministic ties                  | Verified difficulty ascending, then canonical problem ID ascending.          |

The protected endpoint returns candidate IDs and an explanation reason for each
selection. The Contest page copies those IDs into its existing checkbox form;
the user can add or remove any problem before the ordinary durable creation
mutation runs.
