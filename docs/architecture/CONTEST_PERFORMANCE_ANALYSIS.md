# Contest Performance Analysis

## Scope

P1-906 summarizes durable contest-session evidence. It is not an AI judgment and
does not estimate ability, rating, rank, problem quality, mistakes or a
performance label.

## Factual output

| Measure                               | Persisted evidence                                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Session state                         | Contest `status`.                                                                                                                            |
| Item counts and completion percentage | Ordered item statuses.                                                                                                                       |
| Score and elapsed-time penalty        | Existing `completion-time-v1` projection.                                                                                                    |
| Elapsed contest time                  | `startedAt` plus `completedAt` for completed sessions, `expiresAt` for expired sessions, or the server observation time for active sessions. |
| Item timing availability              | Presence of a valid `completedAt` at or after `startedAt`.                                                                                   |

If no durable start or terminal timestamp exists, the related measure is
reported as unavailable rather than inferred. The analysis keeps completed and
skipped outcomes distinct and retains no title, notes, source code or private
attempt text beyond the session detail already authorized for the owner.
