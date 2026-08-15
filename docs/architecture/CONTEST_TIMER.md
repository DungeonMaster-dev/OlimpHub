# Virtual Contest Timer

## Scope

P1-902 adds a configurable duration and a server-derived deadline to the
owner-scoped virtual contest lifecycle. It remains separate from P1-903 scoring
and penalty rules: a timer supplies only elapsed and remaining-time facts.

## Contract

| Field             | Rule                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `durationMinutes` | Chosen on draft creation within the server-validated range.                                                             |
| `startedAt`       | Written exactly once when an owned draft starts.                                                                        |
| `expiresAt`       | Calculated on the server from `startedAt + durationMinutes`; clients never supply it.                                   |
| `status`          | A running session transitions to durable `expired` only after its deadline is observed by a protected read or mutation. |

The detail response derives `remainingSeconds` from the server clock and
returns `isExpired` without trusting browser time. Expiration blocks further
item resolution; it does not assign a score, penalty, rank or inferred contest
outcome. There is no scheduled expiration job in P1-902, so a dormant contest
is materialized as expired on its next protected interaction.

## Evidence boundary

Timer events contain only owner-scoped lifecycle metadata: the contest session
identifier and configured duration. They never retain problem statements,
private contest titles, source code or client-reported elapsed time.
