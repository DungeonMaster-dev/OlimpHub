# Contest Analysis

## Scope

P1-1007 introduces the `contest-analysis-v1` terminal contest-analysis
projection through protected contest detail. It composes only the established
contest-performance, scoring and autopsy facts and is unavailable until the
contest is completed or expired.

The projection must be unavailable for draft and active contests. It may return
completion, timing evidence, scoring availability and position-ordered terminal
statuses, but must never infer rank, rating, skill, problem quality, strategy,
mistake cause or future performance. It must not read notes, source code, raw
activity metadata, external handles or credentials.
