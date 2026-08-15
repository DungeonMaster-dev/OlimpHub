# Progress Analysis

## Scope

P1-1003 transforms `user-context-v1` aggregate values into explainable factual
observations. It is deterministic and does not call a model. It is an
AI-ready, protected evidence projection: later Coach scenarios may use these
facts, but cannot treat them as a prediction.

| Observation             | Aggregate evidence                                     |
| ----------------------- | ------------------------------------------------------ |
| Solved progress records | `progressByStatus.solved`.                             |
| Open personal work      | `in_progress + paused` progress records.               |
| Planned/review work     | `planned + review` progress records.                   |
| Active attempts         | `attemptsByState.active`.                              |
| Session facts           | Training and contest session status counts.            |
| Evidence insufficiency  | No progress records, attempts or sessions are present. |

The analysis does not infer improvement, skill, ability, rating, future outcome,
mistake cause, productivity or time spent. Its outputs retain calculation and
context versions, counts and reason codes so a later UI or model can explain
their factual basis.
