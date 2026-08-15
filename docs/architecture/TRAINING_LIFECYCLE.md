# Training Session Lifecycle

## Ownership and sequence

Each training session belongs to one user. Creation persists one ordered item list: the first item is `active`; all remaining items are `queued`. Detail and update procedures scope the session to the authenticated owner before reading or changing any item.

## Server-enforced transitions

Only the active item may become `completed` or `skipped`. Terminal items remain terminal and cannot be reactivated. A terminal transition causes the server to inspect the ordered session list. If queued work remains, the first queued item becomes active in the same protected lifecycle path. The client requests only the active item’s terminal outcome and refreshes its detail projection; it does not decide which item is next.

## Completion and privacy

When every item is terminal, the server marks the session `completed` and records its completion timestamp. Lifecycle activity contains only owner-scoped identifiers and counts, never the session title, problem statement, notes, source code or hint content. Repeated unchanged mutations are deduplicated.

## Post-training analysis

The completed-session view summarizes only persisted item statuses: completed count, skipped count, unresolved count and the completed-item percentage. It does not infer a skill level, problem-solving quality, rating change or a hidden outcome from those facts.
