# Training Recommendations

## Scope

P1-1006 exposes a dedicated, owner-scoped training-plan recommendation. It
combines the P1-1005 real-catalogue eligible-problem projection with completed
attempt timing evidence. It does not create a session, modify progress or call a
model; the user applies the suggested problems to the normal editable training
form.

| Plan field            | Persisted evidence                                                                                                 | Guardrail                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Suggested problem IDs | Eligible real catalogue candidates plus owner progress and active training/contest assignment exclusions.          | Terminal and assigned problems are excluded.                      |
| Per-problem reason    | Recorded progress priority or labelled catalogue fallback.                                                         | Never claims skill, ability or outcome.                           |
| Expected duration     | Median bounded elapsed time across at least three completed solved attempts, multiplied by selected problem count. | Explicitly unavailable with insufficient timing evidence.         |
| Editable handoff      | The plan preselects the existing normal session form.                                                              | The user can change title and problems before creating a session. |

The query excludes notes, source code, raw activity metadata, external handles,
credentials and free-form text. Results retain calculation versions and evidence
status to prevent a later Coach flow from misrepresenting a deterministic plan
as a predictive judgment.
