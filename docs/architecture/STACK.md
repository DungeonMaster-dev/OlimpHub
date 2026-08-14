# Production Stack — OlimpHub

**Backlog task:** P0-101  
**Status:** approved for Phase 1  
**Date:** 2026-08-14

## Decision

OlimpHub uses the initialized TypeScript full-stack template as a modular monolith. It provides a typed React client, an Express application server, tRPC contracts, Manus OAuth, a managed MySQL-compatible database through Drizzle ORM, and a testable Vitest runtime. The selection fits the personal, authenticated workspace while retaining explicit boundaries for Codeforces ingestion, analytics, AI coaching, and future isolated code execution.

| Concern             | Chosen technology                                                                                                 | Reason                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Client              | React 19, TypeScript, Vite, Wouter                                                                                | Typed, fast private application UI with route-level composition.                           |
| Design system       | Tailwind CSS 4, shadcn/Radix primitives, Lucide                                                                   | Accessible composable controls and a coherent premium visual system.                       |
| Application API     | Express 4 with tRPC 11 and Zod                                                                                    | Server-enforced validation, protected procedures, and end-to-end TypeScript contracts.     |
| Identity            | Manus OAuth and secure server-managed session cookie                                                              | No custom password lifecycle; private routes use `protectedProcedure`.                     |
| Persistence         | Managed MySQL-compatible database with Drizzle ORM                                                                | Relational integrity for source provenance, attempts, activity, and explainable analytics. |
| Migrations          | Drizzle Kit generated SQL applied through the managed database migration workflow                                 | Schema and production database remain reviewable and synchronized.                         |
| Background work     | Transactional outbox plus platform-managed HTTP Heartbeat callbacks                                               | Idempotent retryable Codeforces refreshes without in-process timers.                       |
| External data       | Source-specific adapter layer using the official Codeforces API                                                   | Keeps source contracts, limits, retries, and provenance outside domain modules.            |
| Testing             | Vitest for domain, router, and integration tests; ESLint, Prettier, TypeScript checks and rendered-browser review | Fast regression feedback plus visual verification.                                         |
| High-risk execution | Separate future microVM-backed execution plane                                                                    | User code never runs in the application process or normal hosting container.               |

## Boundaries

The application server owns authenticated CRUD, product projections, and short-lived API work. It must not run long-lived worker loops, `setInterval`, `node-cron`, or user code. Background refreshes are represented as durable jobs and executed through authenticated, idempotent HTTP callbacks after the deployed application is available. The current autoscaling hosting profile is suitable for request-driven user flows and bounded scheduled callbacks; a dedicated execution environment remains a separate blocked dependency.

The API surface is tRPC-first. Browser code consumes typed procedures only; direct browser access to Codeforces, database, secrets, or provider credentials is prohibited. The database stores structured facts and projections, while large or private byte payloads belong in object storage only when a future feature requires them.

## Initial design direction

The private workspace uses a dark editorial interface: deep ink surfaces, warm paper-tinted content panels, cobalt focus accents, precise mono annotations for algorithmic metadata, and a generous spacing scale. The application favours a persistent workspace rail and contextual top bar over a generic admin dashboard. Motion is limited to short opacity/transform transitions and respects reduced-motion preferences.

## Deferred decisions

The first production-ready implementation does not select an LLM provider or provision a Telegram bot token. AI Coach remains behind its documented provider abstraction until a provider is configured, and Telegram remains behind its external token/webhook blocker. Full Codeforces synchronization scheduling is implemented only after the application is deployed and a callback handler is ready; tests and manual authenticated sync controls are developed before enabling recurring work.

## References

[1]: https://codeforces.com/apiHelp "Codeforces API — official reference"
[2]: https://drizzle.team/docs/overview "Drizzle ORM documentation"
[3]: https://trpc.io/docs "tRPC documentation"
