# Configuration and Secrets — OlimpHub

**Backlog task:** P0-104  
**Status:** implemented for the current application boundary  
**Date:** 2026-08-14

OlimpHub uses managed deployment configuration for identity, database access and session signing. Application source code reads configuration only on the server and never commits `.env` files, token values, user session cookies, Codeforces handles or private notes. The browser receives only build-time public configuration that is explicitly prefixed for client use by the platform.

| Configuration area                          | Access boundary             | Current handling                                                                                                                |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Manus OAuth identifiers and session signing | Server and platform runtime | Supplied by the managed template; sessions are verified server-side.                                                            |
| Database connection                         | Server only                 | `DATABASE_URL` is used only by the Drizzle connection helper.                                                                   |
| Codeforces integration                      | Server only                 | The official public API currently needs no project key; the linked handle is stored as private user data.                       |
| AI Coach                                    | Server only, deferred       | No provider is configured; a future provider key must be introduced through managed secrets rather than source or browser code. |
| Telegram                                    | Server only, blocked        | Bot token and webhook secret remain an explicit external blocker and must be managed secrets.                                   |

The production baseline rejects secret-like fields in structured logs. New integrations must document their environment variable name, server/client boundary, rotation procedure and failure mode before their first use.
