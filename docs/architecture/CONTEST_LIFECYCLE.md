# Virtual Contest Lifecycle

## Scope

P1-901 introduces private, owner-scoped virtual contest sessions. Contest data must remain separate from training sessions because contest timing, scoring and penalty policy are later Phase 9 responsibilities. The initial lifecycle persists only a title, ordered canonical problem references and explicit session state.

The explicit duration, server-derived deadline and durable `expired` state added in
P1-902 are specified in [CONTEST_TIMER.md](./CONTEST_TIMER.md). Timer facts
remain distinct from the later scoring and penalty policy.

The persisted-evidence-only `completion-time-v1` scoring projection added in
P1-903 is specified in [CONTEST_SCORING.md](./CONTEST_SCORING.md). It remains
separate from later contest analysis and never implies a rank or rating outcome.

The deterministic, owner-scoped suggestion and editable contest-creation
handoff added in P1-904 are specified in
[CONTEST_SELECTION.md](./CONTEST_SELECTION.md).

The protected, structured AI draft proposal and its explicit editable handoff
added in P1-905 are specified in
[AI_CONTEST_GENERATION.md](./AI_CONTEST_GENERATION.md).

## Implemented state contract

A contest session begins as `draft`, may become `active`, and finishes as `completed` or `archived`. Its ordered items are `queued`, `active`, `completed` or `skipped`. Starting an owned draft activates exactly the first queued item. Only one item may be active; clients can submit only terminal resolution states for that item. A terminal current-item transition promotes the next queued item server-side, while completion requires every item to be terminal.

## Ownership and evidence boundaries

All list, detail and mutation operations scope the contest session to the authenticated owner. P1-901 does not calculate elapsed time, a score, penalty, rank or a contest performance conclusion. Those facts require the later timer, scoring and analysis tasks. Activity tracking records only compact owner-scoped lifecycle facts after a real contest session exists: contest start, explicit item completion or skip, and session completion.
