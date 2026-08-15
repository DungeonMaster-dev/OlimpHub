# Privacy and Activity Retention Policy

**Status:** implemented baseline  
**Date:** 2026-08-15

OlimpHub keeps activity data inside the authenticated user's private workspace. Activity events are factual interaction records rather than a copy of notes, hint text, solutions, source code, OAuth secrets, or external-account credentials.

## Owner controls

| Control                 | Options                                             | Enforced effect                                                                                                                                  |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Activity tracking       | `enabled`, `minimal`                                | Minimal mode suppresses detailed workspace page and editor facts before persistence.                                                             |
| Analytics retention     | 30, 90, or 365 days                                 | Activity projections cannot read records older than the owner-selected window. Saving a shorter window permanently deletes older activity facts. |
| Delete activity history | Exact typed confirmation: `DELETE_ACTIVITY_HISTORY` | Permanently deletes all `activity_events` for the authenticated user only.                                                                       |

The activity-history deletion control does **not** delete private notes, attempts, personal problem progress, training sessions, Codeforces links, imported public submissions, or rating history. Those entities have separate product purposes and lifecycle rules.

## Server-side enforcement

The retention cutoff is calculated on the server from the user’s persisted preference. Dashboard recent activity, analytics summary, activity timeline, calendar statistics, and activity streak all query only records at or newer than that cutoff. The query boundary is owner-scoped by authenticated `userId`; the browser never selects a workspace identifier or another user’s activity.

When the retention preference is saved, the application deletes the authenticated user's activity events older than the newly selected cutoff. A separate protected purge mutation deletes all activity events only after exact confirmation validation. Both destructive paths bind their database condition to the session user and do not accept a target user ID.

## Limits and transparency

The selected window is currently expressed as elapsed 24-hour days for storage filtering. Calendar summaries and streaks label their basis as UTC to avoid implying a local-time boundary that the server did not use. Users see the retention choice and the deletion scope in Settings before acting.

This policy covers the first-release private activity ledger. Account deletion, notes/attempts deletion, external-source revocation, and export delivery need their own explicit flows before they are offered.
