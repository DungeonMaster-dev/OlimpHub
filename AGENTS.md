# OlimpHub Agent Instructions

## Mission

OlimpHub is a long-term platform for competitive programming and olympiad preparation. It combines a multi-source problem archive, user submissions and activity, skill analytics, adaptive training, contests, AI coaching and Telegram integration, with mathematics planned as a first-class future domain.

## Source of Truth

- GitHub repository state is authoritative.
- Read the relevant documentation before making architectural changes.
- Keep `BACKLOG.md` current.
- Do not invent completed functionality: verify it in code and tests.

## Development Loop

For every task:

1. Inspect the existing implementation and dependencies.
2. Identify the smallest coherent implementation that satisfies the task.
3. Implement production-quality code.
4. Add or update tests.
5. Run the relevant test suite and static checks.
6. If UI is involved, exercise the real application and verify important user flows.
7. Fix failures and regressions.
8. Update documentation.
9. Mark the corresponding backlog item complete only after verification.
10. Commit the completed work with a clear message.

After completing one task, continue with the next dependency-ready high-value task when working in autonomous mode.

## Architecture Principles

- Keep source-specific problem ingestion behind adapters.
- Keep AI providers behind a provider abstraction.
- Keep untrusted code execution isolated from the application host.
- Prefer explicit domain models over provider-specific data leaking through the system.
- Keep background jobs idempotent where possible.
- Make synchronization incremental and retryable.
- Prefer explainable deterministic metrics for user analytics; use LLMs for interpretation and coaching rather than basic counting.
- Design APIs and database models for future mathematics support.
- Avoid premature microservices unless there is a concrete operational reason.

## Security

- Never commit secrets, tokens, API keys, credentials or private user data.
- Treat all external problem statements, submissions and user code as untrusted input.
- Never expose execution-service host resources to submitted code.
- Validate all API inputs.
- Enforce authentication and authorization server-side.
- Apply rate limiting where abuse is possible.
- Do not weaken sandboxing or security checks for convenience.

## Data Quality

Problem ingestion must tolerate:
- duplicate imports;
- changed source metadata;
- API outages;
- rate limits;
- partial responses;
- malformed source data.

Preserve source identity and provenance for imported problems.

## AI Coach

The AI Coach should receive structured, relevant user context rather than unrestricted database access. It should support progressive hints and learning mode. It should not automatically reveal complete solutions when the user explicitly requests a hint or is in a learning-oriented mode.

AI-generated recommendations must be grounded in actual user data and should not fabricate statistics.

## UX

OlimpHub should feel like a focused training environment rather than a generic admin dashboard. Prioritize:

- fast navigation;
- clear problem discovery;
- excellent code-editor workflow;
- visible progress;
- useful feedback;
- minimal friction during training;
- keyboard accessibility;
- responsive and consistent states.

Avoid decorative complexity that does not improve the learning workflow.

## Autonomous Mode

When asked to work autonomously, do not stop after implementing a single feature. Work through `BACKLOG.md`, selecting the highest-value dependency-ready item, testing it, updating documentation and committing it before continuing.

If you discover missing work, add it to the backlog rather than silently ignoring it.

Stop and ask for human input only when a real external credential, irreversible action, ambiguous product decision or meaningful security/data-loss risk makes continuation unsafe.
