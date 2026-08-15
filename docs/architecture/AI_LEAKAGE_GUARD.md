# Learning-Mode Leakage Guard

P1-1009 protects replayed approved hint content before it reaches progressive
guidance. It is deliberately conservative: a revealed hint containing code-like
blocks, explicit solution framing, or imperative full-answer language is
withheld from the recap rather than transformed into a potentially misleading
partial solution.

| Detected pattern                                                                       | Guidance behavior                                              |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Fenced code, source-code syntax or `function`/`class` declaration                      | Withhold the affected hint from guidance.                      |
| Explicit solution framing such as “full solution”, “complete solution”, or “answer is” | Withhold the affected hint from guidance.                      |
| Ordinary pedagogical hint content                                                      | Replay unchanged only if its level is already server-revealed. |

The original approved hint is not modified by this guard, and the existing
server-controlled reveal flow remains authoritative. The guard only narrows the
separate learning-mode guidance recap, returning a labelled blocked state when
content is withheld.
