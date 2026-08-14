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
- [ ] P0-004 Define canonical Problem data model independent of source.
- [ ] P0-005 Define user/activity/submission data model.
- [ ] P0-006 Define skill taxonomy and skill dependency graph.
- [ ] P0-007 Define AI Coach architecture and provider abstraction.
- [ ] P0-008 Define secure code execution architecture.
- [ ] P0-009 Define Telegram integration architecture.
- [ ] P0-010 Produce architecture, product, security and data-source documentation.

# Phase 1 — Engineering Foundation

- [ ] P0-101 Choose and document production-ready stack.
- [ ] P0-102 Create frontend/backend project structure.
- [ ] P0-103 Configure database and migrations.
- [ ] P0-104 Configure environment and secrets management.
- [ ] P0-105 Add structured logging and error handling.
- [ ] P0-106 Add linting, formatting and type checking.
- [ ] P0-107 Add unit/integration test infrastructure.
- [ ] P0-108 Add Docker development environment.
- [ ] P0-109 Add CI pipeline.
- [ ] P0-110 Add health/readiness endpoints.

# Phase 2 — Core UI

- [ ] P1-201 Design and implement application shell/navigation.
- [ ] P1-202 Implement authentication screens and flow.
- [ ] P1-203 Implement Dashboard.
- [ ] P1-204 Implement Problem Explorer.
- [ ] P1-205 Implement Problem Page.
- [ ] P1-206 Implement submission history.
- [ ] P1-207 Implement training UI.
- [ ] P1-208 Implement contest UI.
- [ ] P1-209 Implement analytics UI.
- [ ] P1-210 Implement Skills UI.
- [ ] P1-211 Implement AI Coach UI.
- [ ] P1-212 Implement settings/profile.
- [ ] P1-213 Add loading, error and empty states.
- [ ] P1-214 Perform first UX audit and fix issues.

# Phase 3 — Problem Data Platform

- [ ] P1-301 Implement source adapter interface.
- [ ] P1-302 Implement Codeforces adapter.
- [ ] P1-303 Implement Codeforces incremental synchronization.
- [ ] P1-304 Implement deduplication and canonicalization.
- [ ] P1-305 Implement caching and rate limiting.
- [ ] P1-306 Implement AtCoder adapter.
- [ ] P1-307 Implement CSES adapter/importer.
- [ ] P1-308 Investigate and implement Kattis adapter if appropriate.
- [ ] P1-309 Design olympiad archive import pipeline.
- [ ] P1-310 Add source health/monitoring.
- [ ] P1-311 Add ingestion integration tests.

# Phase 4 — User & Codeforces Profile

- [ ] P1-401 Implement Codeforces handle linking.
- [ ] P1-402 Import rating and contest history.
- [ ] P1-403 Import submissions and verdicts.
- [ ] P1-404 Map external problems to canonical problems.
- [ ] P1-405 Implement background profile synchronization.
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
