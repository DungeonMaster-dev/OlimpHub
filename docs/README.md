# OlimpHub Documentation

This directory contains the product and engineering documentation that should stay aligned with the implementation.

## Current documentation

- [product/PLATFORM_UX_RESEARCH.md](product/PLATFORM_UX_RESEARCH.md) — observed UX patterns from competitive-programming platforms and OlimpHub acceptance criteria.
- [data/CODEFORCES_API.md](data/CODEFORCES_API.md) — official Codeforces API contract, limitations and adapter requirements.
- [data/OTHER_SOURCES.md](data/OTHER_SOURCES.md) — source-access assessment for AtCoder, CSES, Kattis and olympiad archives.
- [architecture/DATABASE.md](architecture/DATABASE.md) — source-independent canonical problem model, provenance and catalogue invariants.
- [architecture/LEARNING_DATA.md](architecture/LEARNING_DATA.md) — user, activity, attempt, submission and privacy data model.
- [architecture/SKILL_TAXONOMY.md](architecture/SKILL_TAXONOMY.md) — versioned algorithm and mathematics skills DAG with explainable mappings.

## Planned documentation

- `product/PRODUCT_SPEC.md` — product vision, users, core workflows and feature requirements.
- `architecture/ARCHITECTURE.md` — system architecture and major technical decisions.
- `architecture/API.md` — public/internal API conventions and contracts.
- `architecture/AI_ARCHITECTURE.md` — AI Coach, retrieval, providers and evaluation.
- `architecture/SECURITY.md` — threat model, security controls and sandbox assumptions.
- `data/DATA_SOURCES.md` — source adapters, provenance, synchronization and limitations.
- `operations/DEPLOYMENT.md` — development and production deployment.
- `operations/OBSERVABILITY.md` — logging, metrics, tracing and alerts.

When implementation changes materially affect one of these areas, update the corresponding document in the same change.
