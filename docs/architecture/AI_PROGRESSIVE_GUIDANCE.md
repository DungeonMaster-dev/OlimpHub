# Progressive Guidance

P1-1008 introduces an owner-scoped guidance contract for an existing attempt.
The server is authoritative: it loads the persisted `highestHintLevel` and may
select only approved hint content whose level is less than or equal to that
value. It never accepts a client-selected level, never reads a future hint, and
never exposes notes, source code or raw activity metadata.

| State                             | Guidance response                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| No hint has been revealed         | A learning-mode boundary and an instruction to request the first approved hint; no hint content. |
| One or more hints revealed        | A factual, level-labelled recap of only the already revealed approved hint content.              |
| Corrupt or unavailable hint state | A safe unavailable response; no fallback hint disclosure.                                        |

Guidance is **not a solution generator**. The contract retains the
server-enforced hint level, so later model integration cannot override
disclosure sequencing. P1-1009 separately owns server-side sanitization of
overly detailed stored hint content before it reaches this replay-only contract.
