# Adaptive Training Selection

## Scope

`adaptive-training-v1` is a protected, deterministic selector for a small manual training set. It reads only the current owner’s persisted problem-progress and active-training membership alongside canonical catalogue metadata. It does not call an AI provider, infer missing learning facts, inspect private notes, or create a training session automatically.

## Eligibility and ranking

The selector considers a bounded catalogue candidate pool and omits problems already solved, skipped, archived, or held by an active training session. It ranks the remaining candidates in this order: active unfinished personal work, paused work, explicitly planned work, review work, then new available problems. Equal candidates have a stable difficulty and identifier tie-breaker.

| Reason code         | Verified source                      | Meaning                                                                 |
| ------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `recent_attempt`    | Owner `user_problem_progress` status | The problem is currently in progress or paused.                         |
| `goal_alignment`    | Owner `user_problem_progress` status | The problem is explicitly planned or marked for review.                 |
| `insufficient_data` | Absence of the preceding owner facts | The problem is an available fallback, not a claim about skill weakness. |

## API and UI contract

`olimp.training.adaptive({ count })` accepts one to eight recommendations and returns the calculation version plus ordered problems and their factual reason codes. The Training page displays the reasons before the user may apply the suggestions to the ordinary editable session form. The user retains control of the title, selected problems and final create action; `training.create` remains the only session-writing procedure.

## Privacy and future scope

No recommendation reason includes note text, hint content, source-code content or a copied problem statement. Skill-weakness targeting and recent-exposure balancing remain separate backlog work so the selector never overstates thin evidence.
