# AI Contest Generation

## Scope

P1-905 generates an **editable draft proposal**, not a contest session. A
protected server procedure first derives owner-scoped eligible canonical
problems, then passes only a compact candidate catalogue to the model. The
ordinary durable `contests.create` mutation remains the sole way to persist a
contest.

## Input boundary

The model receives at most 24 protected eligible candidates, each with only its
canonical ID, public title, difficulty, public tags and a coarse selection
reason. It never receives private notes, attempt text, hint content, source
code, Codeforces credentials, user name or raw activity events.

## Structured output contract

The model must return a JSON-schema-validated object containing:

| Field             | Validation                                                           |
| ----------------- | -------------------------------------------------------------------- |
| `title`           | 3–180 character contest title without private-user attribution.      |
| `durationMinutes` | Integer duration within the existing 15–480 minute timer boundary.   |
| `problemIds`      | 1–8 unique IDs, all from the server-supplied eligible candidate set. |
| `rationale`       | A brief public-data-only explanation for the editable draft.         |

The server rejects invalid JSON, duplicates, unavailable IDs or any output
outside those limits. The UI displays the proposal and requires explicit user
action to copy it into the editable creation form; it never auto-creates or
auto-starts a contest.
