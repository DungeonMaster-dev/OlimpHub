# Recurring Evidence Patterns

## Scope

P1-1004 detects repeated, persisted **attempt patterns**. The UI deliberately
does not claim to diagnose a learner's mistake or its cause. A pattern appears
only after at least two matching owner-scoped attempts.

| Pattern                       | Required persisted evidence                                | It does not mean                                                       |
| ----------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Repeated unresolved outcomes  | Two or more terminal attempts with `outcome = not_solved`. | That a learner lacks a skill or will fail a future problem.            |
| Repeated abandoned attempts   | Two or more attempts with `state = abandoned`.             | Why an attempt was abandoned.                                          |
| Repeated later-stage hint use | Two or more attempts with `highestHintLevel >= 2`.         | That asking for a hint was incorrect or that a hint caused an outcome. |

The protected query reads only `state`, `outcome` and `highestHintLevel` from
the current owner's attempts. It does not read notes, source code, problem
statements, raw activity metadata, external handles, session credentials or
attempt text. The result retains a calculation version, fixed threshold and
explicit insufficiency state so a later Coach flow cannot turn counts into an
unsupported causal conclusion.
