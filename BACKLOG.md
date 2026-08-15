# OlimpHub Development Backlog

> This file is the operational backlog for autonomous development. GitHub is the source of truth.
>
> Statuses: `[ ]` planned, `[~]` in progress, `[x]` completed, `[!]` blocked.
>
> Priority: P0 critical/foundation, P1 core product, P2 important, P3 later.

## Operating Rules

1. Work from top to bottom within the highest-priority available phase unless a dependency requires otherwise.
2. Complete a task fully: implementation, tests, documentation, and verification.
3. Do not mark a task `[x]` until it is actually implemented and verified.
4. If a task reveals missing work, add a new task to the appropriate section.
5. Keep this file updated after every meaningful task.
6. Prefer small coherent commits over one enormous commit.
7. Never commit secrets, API keys, tokens, user data, or generated credentials.
8. Do not weaken security or tests merely to make a task pass.
9. Before changing architecture, check `docs/architecture/` and update the relevant document.
10. When the current phase is complete, continue to the next phase without waiting for human input unless a real external credential or product decision is required.

---

# Phase 0 — Discovery & Product Definition

- [x] P0-001 Research competitive programming platforms and extract useful UX/product patterns. See `docs/product/PLATFORM_UX_RESEARCH.md` (completed 2026-08-14).
- [x] P0-002 Research Codeforces API and data limitations. See `docs/data/CODEFORCES_API.md` (completed 2026-08-14).
- [x] P0-003 Research AtCoder, CSES, Kattis and viable olympiad data sources. See `docs/data/OTHER_SOURCES.md` (completed 2026-08-14).
- [!] P0-003a Confirm written permission or a compatible published licence before implementing any non-Codeforces automated importer or local content mirror. Blocked: this requires a source operator/rightsholder response; see `docs/data/OTHER_SOURCES.md`.
- [x] P0-004 Define canonical Problem data model independent of source. See `docs/architecture/DATABASE.md` (completed 2026-08-14).
- [x] P0-005 Define user/activity/submission data model. See `docs/architecture/LEARNING_DATA.md` (completed 2026-08-14).
- [x] P0-006 Define skill taxonomy and skill dependency graph. See `docs/architecture/SKILL_TAXONOMY.md` (completed 2026-08-14).
- [x] P0-007 Define AI Coach architecture and provider abstraction. See `docs/architecture/AI_ARCHITECTURE.md` (completed 2026-08-14).
- [x] P0-008 Define secure code execution architecture. See `docs/architecture/EXECUTION_SECURITY.md` (completed 2026-08-14).
- [!] P0-008a Validate and provision an isolated execution environment with hardware virtualisation or an equivalent managed runtime before any user-code execution implementation. Blocked: requires infrastructure ownership and deployment approval; see `docs/architecture/EXECUTION_SECURITY.md`.
- [x] P0-009 Define Telegram integration architecture. See `docs/architecture/TELEGRAM_ARCHITECTURE.md` (completed 2026-08-14).
- [!] P0-009a Provision a Telegram bot token, a managed secret and a public HTTPS webhook endpoint before enabling the integration. Blocked: requires a BotFather-created token and deployment ownership; see `docs/architecture/TELEGRAM_ARCHITECTURE.md`.
- [x] P0-010 Produce architecture, product, security and data-source documentation. See `docs/product/PRODUCT_SPEC.md`, `docs/architecture/ARCHITECTURE.md`, `docs/architecture/SECURITY.md` and `docs/data/DATA_SOURCES.md` (completed 2026-08-14).

# Phase 1 — Engineering Foundation

- [x] P0-101 Choose and document production-ready stack. See `docs/architecture/STACK.md` (completed 2026-08-14).
- [x] P0-102 Create frontend/backend project structure. React, Express, tRPC and domain router boundaries are implemented (completed 2026-08-14).
- [x] P0-103 Configure database and migrations. Canonical OlimpHub schema, reviewed SQL migration and database journal are synchronized (completed 2026-08-14).
- [x] P0-104 Configure environment and secrets management. See `docs/architecture/CONFIGURATION.md` (completed 2026-08-14).
- [x] P0-105 Add structured logging and error handling. Request/tRPC error logs redact sensitive fields; unhandled errors return a generic response (completed 2026-08-14).
- [x] P0-106 Add linting, formatting and type checking. ESLint, Prettier and TypeScript commands are configured (completed 2026-08-14).
- [x] P0-107 Add unit/integration test infrastructure. Vitest covers auth boundaries and deterministic learning rules; test command is part of CI (completed 2026-08-14).
- [x] P0-108 Add Docker development environment. A Node 22 dev-container supports reproducible local container workflows without replacing managed production builds (completed 2026-08-14).
- [x] P0-109 Add CI pipeline. GitHub Actions verifies install, lint, format, tests, types and production build (completed 2026-08-14).
- [x] P0-110 Add health/readiness endpoints. `GET /api/healthz` and `GET /api/readyz` are verified against the running service (completed 2026-08-14).
- [x] P0-111 Add durable idempotency receipts for retryable personal mutations and activity events. Durable receipts now replay note-save/training-create responses; activity events and no-op transitions are deduplicated (completed 2026-08-14).
- [x] P0-112 Add behavioural tests for catalogue filters, attempt lifecycle, training progression and Codeforces sync cooldown/error paths. Workflow and Codeforces transport regression suites cover normalization, lifecycle guards, cooldown, accepted, rejected and failed provider responses (completed 2026-08-14).

# Phase 2 — Core UI

- [x] P1-201 Design and implement application shell/navigation. Protected responsive workspace shell, sidebar navigation and persistent layout are implemented and visually reviewed.
- [x] P1-202 Implement authentication screens and flow. Manus OAuth entry, loading shell and private-workspace gate are implemented; auth boundary tests pass.
- [~] P1-203 Implement Dashboard. UI and protected data query exist; complete only after a persisted attempt/activity journey is verified.
- [~] P1-204 Implement Problem Explorer. UI and protected filters exist; complete only after the official import and an imported-data filter journey are verified.
- [~] P1-205 Implement Problem Page. Workspace implementation exists; complete only after an imported problem, attempt, note and hint journey are verified.
- [x] P1-206 Implement submission history. Protected Codeforces verdict history, verdict filtering, canonical-problem links, private empty state and an anonymous-access regression test are implemented and visually reviewed.
- [~] P1-207 Implement training UI. Session implementation exists; complete only after an imported-data creation and progression journey are verified.
- [ ] P1-208 Implement contest UI.
- [x] P1-209 Implement analytics UI. Configurable period, calculation-version visibility and evidence-backed metrics are implemented.
- [x] P1-210 Implement Skills UI. Approved skill map, prerequisite paths and imported problem-link rendering are implemented.
- [ ] P1-211 Implement AI Coach UI.
- [~] P1-212 Implement settings/profile. UI and protected persistence code exist; complete only after a successful settings and Codeforces-handle persistence journey is verified.
- [x] P1-213 Add loading, error and empty states. Core screens provide loading skeletons and explicit empty/error states.
- [x] P1-214 Perform first UX audit and fix issues. Desktop and mobile visual review was completed; navigation, filtering and skill-map clarity were improved.

# Phase 3 — Problem Data Platform

- [x] P1-301 Implement source adapter interface. `ProblemSourceAdapter` and the live `CodeforcesAdapter` provide normalized snapshot/submission operations with typed source outcomes; contract tests pass.
- [x] P1-302 Implement Codeforces adapter. The live adapter normalizes official problem snapshots and public submission pages, classifies transient versus permanent failures, is used by sync routes, and has contract tests.
- [x] P1-303 Implement Codeforces incremental synchronization. Catalogue fingerprints skip unchanged snapshots; submission sync walks multi-page overlap until the saved cursor or exhaustion, then advances a durable cursor only after successful persistence. Regression tests cover the >1000-new-submissions case.
- [x] P1-304 Implement deduplication and canonicalization. Source identity remains unique by `(sourceId, externalKey)`; explicit administrator-reviewed `ProblemRelation` records provide nondestructive duplicate/canonical links without merging personal histories. Proposal and review decisions reconcile status from all remaining active relations, including the rejected-proposal regression path; the managed schema migration is applied.
- [x] P1-305 Implement caching and rate limiting. A provider-wide in-process Codeforces coordinator coalesces identical in-flight calls, caches only successful catalogue snapshots for five minutes, never caches failures or submission pages, and spaces distinct upstream calls by at least 2.2 seconds; deterministic regressions pass.
- [ ] P1-306 Implement AtCoder adapter.
- [ ] P1-307 Implement CSES adapter/importer.
- [ ] P1-308 Investigate and implement Kattis adapter if appropriate.
- [ ] P1-309 Design olympiad archive import pipeline.
- [x] P1-310 Add source health/monitoring. An admin-only tRPC projection aggregates durable source sync states into healthy, running, rate-limited, degraded, attention and unknown conditions without exposing raw provider errors; domain and authorization tests pass.
- [x] P1-311 Add ingestion integration tests. Adapter-to-coordinator-to-cursor-collector scenarios verify multi-page offsets, durable cursor stop, source-code exclusion, retryable failure propagation, in-flight coalescing, 2.2-second page pacing and retry-after-failure behavior without depending on the live provider; 42 tests pass.

# Phase 4 — User & Codeforces Profile

- [x] P1-401 Implement Codeforces handle linking. Settings validates the declared public handle through the official `user.info` method, stores Codeforces canonical capitalization only on success, prevents cross-workspace duplicate links, communicates validation failures, and explicitly does not claim external-account ownership. Router regressions cover success, invalid profile, conflict and retryable provider failure paths; final lint has zero errors and formatting passes.
- [x] P1-402 Import rating and contest history. The official `user.rating` adapter normalizes public contest-rating facts; a managed migration persists them idempotently by user, contest and update time; protected sync records activity and Settings exposes progress/error feedback. Repeated-upsert regression passes; final lint has zero errors and formatting passes.
- [x] P1-403 Import submissions and verdicts. Public `user.status` pages are normalized without source code, collected past the durable cursor with overlap protection, upserted by source submission ID, and exposed only through owner-scoped verdict history with pagination, filters and canonical problem links. Adapter-to-collector regressions and visual history audit pass.
- [x] P1-404 Map external problems to canonical problems. Codeforces submission import resolves `problemId` only from a source-scoped stable external key; unknown keys remain unmapped rather than being guessed from title, URL or tags. Domain regression and final quality gates pass.
- [~] P1-405 Implement background profile synchronization. Daily 03:00 UTC opt-in Heartbeat lifecycle, task-UID-bound callback, durable per-link state and retry-safe callback behavior are implemented; final quality gates and production publication/activation remain.
- [ ] P1-406 Implement rating/progress timeline.
- [ ] P1-407 Handle API failures, rate limits and partial synchronization.
- [ ] P1-408 Add synchronization tests.

# Phase 5 — Code Execution

- [ ] P0-501 Design execution service threat model.
- [ ] P0-502 Implement isolated C++ compilation/execution.
- [ ] P0-503 Implement sample-test execution.
- [ ] P0-504 Implement submission execution pipeline.
- [ ] P0-505 Enforce CPU, memory, process and time limits.
- [ ] P0-506 Disable network access for untrusted code.
- [ ] P0-507 Isolate temporary filesystem and clean up after execution.
- [ ] P0-508 Implement compilation/runtime/TLE/MLE verdicts.
- [ ] P0-509 Add adversarial sandbox tests.
- [ ] P0-510 Perform security review before exposing execution service.

# Phase 6 — Activity & Time Tracking

- [ ] P1-601 Track task-page activity.
- [ ] P1-602 Track editor activity.
- [ ] P1-603 Track submissions and verdict events.
- [ ] P1-604 Track hints/editorial interactions.
- [ ] P1-605 Track training and contest sessions.
- [ ] P1-606 Distinguish active/focused/idle time.
- [ ] P1-607 Implement activity timeline.
- [ ] P1-608 Implement daily/weekly/monthly statistics.
- [ ] P1-609 Implement streak calculation.
- [ ] P1-610 Add privacy controls and retention policy.

# Phase 7 — Skill Engine

- [ ] P1-701 Create algorithm skill taxonomy.
- [ ] P1-702 Create mathematics skill taxonomy for future expansion.
- [ ] P1-703 Create skill dependency graph.
- [ ] P1-704 Implement mastery calculation.
- [ ] P1-705 Incorporate difficulty, attempts, time, hints, recency and related skills.
- [ ] P1-706 Implement explainable mastery reasons.
- [ ] P1-707 Implement skill graph visualization.
- [ ] P1-708 Add mastery regression tests.

# Phase 8 — Training Engine

- [ ] P1-801 Implement manual training creation.
- [ ] P1-802 Implement adaptive problem selection.
- [ ] P1-803 Account for weak skills and recent exposure.
- [ ] P1-804 Estimate expected solve time.
- [ ] P1-805 Implement training session lifecycle.
- [ ] P1-806 Implement Surprise Me training.
- [ ] P1-807 Implement post-training analysis.
- [ ] P1-808 Evaluate recommendation quality with test scenarios.

# Phase 9 — Contest Engine

- [ ] P1-901 Implement virtual contest lifecycle.
- [ ] P1-902 Implement contest timer.
- [ ] P1-903 Implement scoring and penalty systems.
- [ ] P1-904 Implement contest problem selection.
- [ ] P1-905 Implement AI-generated personalized contests.
- [ ] P1-906 Implement contest performance analysis.
- [ ] P1-907 Implement Contest Autopsy.
- [ ] P1-908 Implement replay mode.

# Phase 10 — AI Coach

- [ ] P1-1001 Implement model-provider abstraction.
- [ ] P1-1002 Implement structured user-context builder.
- [ ] P1-1003 Implement progress analysis.
- [ ] P1-1004 Implement recurring-mistake detection.
- [ ] P1-1005 Implement problem recommendations.
- [ ] P1-1006 Implement training recommendations.
- [ ] P1-1007 Implement contest analysis.
- [ ] P1-1008 Implement progressive hint system.
- [ ] P1-1009 Prevent accidental full-solution leakage in learning mode.
- [ ] P1-1010 Add AI request/error/cost observability.

# Phase 11 — Telegram

- [ ] P1-1101 Implement Telegram account linking.
- [ ] P1-1102 Implement `/start`, `/today`, `/stats`, `/training`, `/problem`, `/hint`, `/progress`.
- [ ] P1-1103 Implement daily training notification.
- [ ] P1-1104 Implement reminder notification.
- [ ] P1-1105 Implement streak notification.
- [ ] P1-1106 Implement contest report.
- [ ] P1-1107 Implement weekly progress report.
- [ ] P1-1108 Add notification preferences.

# Phase 12 — Search & Similar Problems

- [ ] P2-1201 Implement full-text problem search.
- [ ] P2-1202 Implement metadata filtering.
- [ ] P2-1203 Implement embeddings pipeline.
- [ ] P2-1204 Implement vector search.
- [ ] P2-1205 Implement hybrid semantic + metadata search.
- [ ] P2-1206 Implement Similar Problems.
- [ ] P2-1207 Build evaluation dataset for semantic search.
- [ ] P2-1208 Measure and improve retrieval quality.

# Phase 13 — Analytics

- [ ] P2-1301 Problem-solving analytics.
- [ ] P2-1302 Verdict analytics.
- [ ] P2-1303 Time-to-solve analytics.
- [ ] P2-1304 Topic performance analytics.
- [ ] P2-1305 Contest performance analytics.
- [ ] P2-1306 Activity analytics.
- [ ] P2-1307 Skill progression analytics.
- [ ] P2-1308 Weekly/monthly reports.

# Phase 14 — Mathematics Expansion

- [ ] P2-1401 Design mathematics taxonomy.
- [ ] P2-1402 Design mathematics problem model extensions.
- [ ] P2-1403 Add math problem sources.
- [ ] P2-1404 Add math training engine support.
- [ ] P2-1405 Add proof/coaching mode.
- [ ] P2-1406 Add math-specific analytics.

# Phase 15 — Security & Reliability

- [ ] P0-1501 Threat-model the complete application.
- [ ] P0-1502 Audit authentication and authorization.
- [ ] P0-1503 Audit API validation and rate limiting.
- [ ] P0-1504 Audit XSS/CSRF/SQL injection risks.
- [ ] P0-1505 Audit file handling and uploads.
- [ ] P0-1506 Audit secrets/configuration.
- [ ] P0-1507 Audit execution sandbox.
- [ ] P0-1508 Add abuse protection.
- [ ] P0-1509 Add dependency/security scanning.
- [ ] P0-1510 Create incident/recovery documentation.

# Phase 16 — Performance & Production

- [ ] P1-1601 Profile backend latency.
- [ ] P1-1602 Optimize database queries and indexes.
- [ ] P1-1603 Optimize frontend rendering.
- [ ] P1-1604 Optimize problem search.
- [ ] P1-1605 Optimize ingestion jobs.
- [ ] P1-1606 Add background job monitoring.
- [ ] P1-1607 Add observability dashboards.
- [ ] P1-1608 Add backup/restore procedure.
- [ ] P1-1609 Add production deployment documentation.

# Phase 17 — Autonomous QA Loop

- [ ] P0-1701 Run complete browser-based user journey audit.
- [ ] P0-1702 Find and fix at least 30 real UX/functional issues.
- [ ] P0-1703 Run security audit.
- [ ] P0-1704 Run performance audit.
- [ ] P0-1705 Run accessibility audit.
- [ ] P0-1706 Run regression suite.
- [ ] P0-1707 Review architecture for accumulated technical debt.
- [ ] P0-1708 Update all documentation to match implementation.
- [ ] P0-1709 Generate next improvement backlog.

# Phase 18 — Long-Term Ideas

- [ ] P3-1801 Personalized olympiad syllabus.
- [ ] P3-1802 Historical olympiad archive browser.
- [ ] P3-1803 Virtual IOI/ICPC-style events.
- [ ] P3-1804 Team training mode.
- [ ] P3-1805 Shared contests.
- [ ] P3-1806 Public/private leaderboards.
- [ ] P3-1807 Advanced knowledge graph.
- [ ] P3-1808 Automated problem-quality scoring.
- [ ] P3-1809 Problem difficulty prediction.
- [ ] P3-1810 Personalized curriculum generation.
- [ ] P3-1811 AI-generated practice problem generation, with quality verification.
- [ ] P3-1812 Offline/PWA mode.
- [ ] P3-1813 Native mobile experience if justified.

---

# Autonomous Development Policy

When instructed to work autonomously:

1. Inspect the current repository state.
2. Select the highest-value uncompleted task whose dependencies are satisfied.
3. Implement it completely.
4. Run relevant tests.
5. Use the application in a realistic way when UI is involved.
6. Fix failures rather than merely reporting them.
7. Update documentation and this backlog.
8. Commit the completed work.
9. Continue to the next task.

Do not stop merely because one feature is complete. Stop only when:

- a real external dependency/credential is required;
- a product decision cannot be inferred safely;
- continuing would create a meaningful security/data-loss risk;
- or all actionable backlog items are complete.
