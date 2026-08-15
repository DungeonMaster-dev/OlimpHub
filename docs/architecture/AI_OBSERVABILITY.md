# AI Observability

P1-1010 will record durable server-side metadata for structured AI operations.
Each record may contain an owner ID, operation key, selected model ID, outcome,
latency, a nullable provider-reported cost/usage estimate, error classification
and timestamp. It must never persist prompt text, response text, notes, source
code, hint content, external handles or credentials.

Observability is advisory and owner-scoped. A provider’s missing usage data is
represented as unavailable rather than estimated from private content.
