# Problem Recommendations

## Dedicated contract

P1-1005 exposes a dedicated protected recommendation surface while reusing the
verified `adaptive-training-v1` selection inputs and priority rules from
P1-802. The contract exposes real catalogue candidates, owner-scoped progress
and explicit per-item reasons without calling a model.

| Selection behavior                      | Existing evidence and guardrail                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Continue unfinished work                | `in_progress` and `paused` progress receive the highest stable priority.                                                        |
| Respect explicit plan/review work       | `planned` and `review` progress are selected with a stated reason.                                                              |
| Exclude finished or active-session work | Solved, skipped and archived progress plus active training items are not eligible.                                              |
| Use a cautious new-problem fallback     | Catalogue candidates have a deterministic, labelled insufficient-history fallback.                                              |
| Adjust difficulty only with evidence    | The target requires three verified recent solved difficulties; otherwise the response explicitly reports insufficient evidence. |
| Editable handoff                        | Training renders reasons and uses suggestions only to preselect the normal editable checkboxes before a user creates a session. |

Existing adaptive-training regression coverage establishes the selection
baseline; P1-1005 adds dedicated protected-route and workspace handoff
coverage. No model call, private notes, source code, raw activity metadata,
external handles or credentials are permitted.
