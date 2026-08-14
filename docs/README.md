# OlimpHub Documentation

This directory contains the product and engineering documentation that should stay aligned with the implementation.

## Current documentation

- [architecture/API.md](architecture/API.md) — protected tRPC modules, server-side guarantees, Codeforces boundaries and health endpoints.
- [product/PLATFORM_UX_RESEARCH.md](product/PLATFORM_UX_RESEARCH.md) — observed UX patterns from competitive-programming platforms and OlimpHub acceptance criteria.
- [product/PRODUCT_SPEC.md](product/PRODUCT_SPEC.md) — product vision, MVP boundaries and testable user workflows.
- [data/CODEFORCES_API.md](data/CODEFORCES_API.md) — official Codeforces API contract, limitations and adapter requirements.
- [data/OTHER_SOURCES.md](data/OTHER_SOURCES.md) — source-access assessment for AtCoder, CSES, Kattis and olympiad archives.
- [data/DATA_SOURCES.md](data/DATA_SOURCES.md) — source registry, rights policy, adapter contract and sync pipeline.
- [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) — target modular-monolith boundaries, contracts, deployment and evolution rules.
- [architecture/STACK.md](architecture/STACK.md) — approved Phase 1 technology stack, background-work strategy and implementation boundaries.
- [architecture/CONFIGURATION.md](architecture/CONFIGURATION.md) — managed configuration boundaries, secret-handling rules and deferred integration prerequisites.
- [architecture/SECURITY.md](architecture/SECURITY.md) — threat model, security controls and release gates.
- [architecture/DATABASE.md](architecture/DATABASE.md) — source-independent canonical problem model, provenance and catalogue invariants.
- [architecture/LEARNING_DATA.md](architecture/LEARNING_DATA.md) — user, activity, attempt, submission and privacy data model.
- [architecture/SKILL_TAXONOMY.md](architecture/SKILL_TAXONOMY.md) — versioned algorithm and mathematics skills DAG with explainable mappings.
- [architecture/AI_ARCHITECTURE.md](architecture/AI_ARCHITECTURE.md) — provider abstraction, safe context, progressive hints and AI Coach controls.
- [architecture/EXECUTION_SECURITY.md](architecture/EXECUTION_SECURITY.md) — isolated code execution boundary, resource limits and security controls.
- [architecture/TELEGRAM_ARCHITECTURE.md](architecture/TELEGRAM_ARCHITECTURE.md) — webhook security, account linking, commands and notification delivery.

## Planned documentation

- [operations/DEVELOPMENT.md](operations/DEVELOPMENT.md) — supported local and containerized development workflow.
- `operations/DEPLOYMENT.md` — development and production deployment.
- `operations/OBSERVABILITY.md` — logging, metrics, tracing and alerts.

When implementation changes materially affect one of these areas, update the corresponding document in the same change.
