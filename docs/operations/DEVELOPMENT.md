# Development Environment — OlimpHub

**Backlog task:** P0-108  
**Status:** implemented  
**Date:** 2026-08-14

The supported default is the managed Node 22 development environment with the repository-pinned pnpm version. Run `pnpm install --frozen-lockfile`, then `pnpm dev`; quality gates are `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm check`.

For contributors whose local workflow uses containers, `.devcontainer/devcontainer.json` supplies a reproducible Node 22 Bookworm development environment with the same lockfile-based install. It is deliberately not a root `Dockerfile`: OlimpHub currently requires only Node.js, and the managed deployment image already builds the full application. Introducing a root Dockerfile would replace that supported build contract without providing a runtime capability that the application needs.

The database is a managed project resource. Local contributors must provide a non-production database URL through their environment and must never commit `.env` files. Migrations are generated with Drizzle, reviewed as SQL, then applied through the project database workflow.
