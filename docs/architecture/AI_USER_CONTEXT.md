# Structured AI User Context

## Scope

P1-1002 creates the minimum factual owner-scoped context that later AI Coach
features may request through a protected procedure. It is a compact aggregate,
not an export of user data and not a model prompt by itself.

| Included                                      | Source                              |
| --------------------------------------------- | ----------------------------------- |
| Time zone, weekly goal and tracking mode      | Owner settings.                     |
| Counts by current problem-progress status     | Owner `user_problem_progress` rows. |
| Counts by attempt state                       | Owner `solving_attempts` rows.      |
| Counts by training and contest session status | Owner session rows.                 |

The builder excludes free-form notes, source code, raw activity metadata,
external handles and any session credential. It does not retrieve problem
titles, problem text, submission source, event metadata or user identity. Every
caller must still choose the smallest relevant subset when constructing an AI
feature prompt.
