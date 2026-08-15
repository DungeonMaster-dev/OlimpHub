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

## Difficulty progression

`difficulty-progression-v1` reads at most the three most recent owner-scoped solved problems with verified canonical difficulty. With all three facts present, it sets a target one 100-point step above their median and exposes a target band of ±200 points, bounded to the supported 800–3500 range. Difficulty proximity is only a tie-breaker after stronger unfinished-progress and explicitly planned-work ranking; it never overrides those factual priorities.

When fewer than three verified solved difficulties exist, the API returns `insufficient_evidence` with no target or range. The Training UI states this boundary instead of guessing an ability level. The selected session remains entirely user-editable in either state.

## Expected solve time

`expected-solve-time-v1` reads up to five recent owner-scoped attempts that were completed with a solved outcome. It accepts only elapsed wall-clock durations between one minute and four hours, then reports the median and a 70–130% typical range after at least three qualifying attempts. The estimate describes persisted elapsed attempt time; it does not claim to measure uninterrupted concentration.

With fewer than three bounded completed attempts, the endpoint returns `insufficient_evidence` and no duration estimate. The Training UI presents that limitation rather than inventing a forecast.

## Surprise Me

Surprise Me deterministically rotates a maximum four-problem subset from the already protected, owner-scoped adaptive-eligible set. Its stable UTC day key and problem identifiers produce a repeatable daily ordering rather than using an untracked random source. The control fills the ordinary editable training form with the selected subset and a title; it never writes a session automatically.

## Privacy and future scope

No recommendation reason includes note text, hint content, source-code content or a copied problem statement. Skill-weakness targeting and recent-exposure balancing remain separate backlog work so the selector never overstates thin evidence.
